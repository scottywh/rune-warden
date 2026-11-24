#!/usr/bin/env python3
"""Build and sign Rune Warden 3D Kari (unified full-3D line) as an Android APK without Android Studio or the SDK.
One simulation (the full 1.9 2D game: skills, armor tiers, anvil, spider) with the spike's
Three.js renderer on top. 3D is the default view; the 2D button falls back to the 2D renderers.

Adapted from the String Bench pipeline: a WebView shell from three small smali
classes, aapt2/apktool/apksigner fetched once via npm (reused here through
CB_TOOLS pointing at the String Bench tools dir).

Usage:  CB_TOOLS=~/workspace/string-bench-source/android/tools python3 android/build_apk.py
        -> android/build/rune/rune-warden.apk
"""
import os, shutil, subprocess, sys, zipfile
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
TOOLS = Path(os.environ.get('CB_TOOLS', HERE / 'tools'))
OUT = HERE / 'build'
KEYSTORE = HERE / 'kari3d.keystore'
KS_PASS = os.environ.get('KS_PASS', '')
if not KS_PASS:
    sys.exit('Set the KS_PASS environment variable to your keystore password before building.')
MIN_SDK, TARGET_SDK = 29, 34
APP = {'id': 'kari', 'app': 'Rune Warden 3D Kari', 'folder': 'Rune Warden 3D Kari', 'package': 'com.runewarden.kari3d',
       'versionCode': 32, 'versionName': '4.0.3'}

WEB = ['index.html', 'style.css', 'game.js', 'render3d.js', 'three.min.js',
       'vision-dungeon.jpg', 'vision-skills.jpg', 'vision-armor.jpg', 'vision-anvil.jpg',
       'stone-wall.jpg', 'stone-floor.jpg', 'wood-planks.jpg',
       'GLTFLoader.js', 'SkeletonUtils.js', 'models/mage.glb', 'models/knight.glb', 'models/barbarian.glb', 'models/rogue.glb', 'models/skeleton_minion.glb', 'models/skeleton_warrior.glb', 'models/skeleton_mage.glb', 'models/rogue_hooded.glb', 'models/skeleton_rogue.glb', 'models/ADVENTURES_LICENSE.txt', 'models/SKELETONS_LICENSE.txt']


def run(cmd, **kw):
    r = subprocess.run([str(c) for c in cmd], capture_output=True, text=True, **kw)
    out = '\n'.join(l for l in (r.stdout + r.stderr).splitlines() if 'JAVA_TOOL_OPTIONS' not in l)
    if r.returncode != 0:
        sys.exit('FAILED: ' + ' '.join(str(c) for c in cmd) + '\n' + out)
    return out


def framework():
    fw = TOOLS / 'framework.jar'
    if not fw.exists():
        with zipfile.ZipFile(TOOLS / 'apktool.jar') as z:
            fw.write_bytes(z.read('brut/androlib/android-framework.jar'))
    return fw


def stage_assets(dst):
    if dst.exists():
        shutil.rmtree(dst)
    dst.mkdir(parents=True)
    for f in WEB:
        (dst / f).parent.mkdir(parents=True, exist_ok=True)
        if f.lower().endswith(('.jpg', '.jpeg', '.png', '.glb')):
            (dst / f).write_bytes((ROOT / f).read_bytes())
        else:
            s = (ROOT / f).read_text(encoding='utf-8')
            (dst / f).write_text(s, encoding='utf-8')


def assemble_dex(smali_dir, out_dex):
    cls = OUT / 'asm-classes'
    cls.mkdir(parents=True, exist_ok=True)
    run(['javac', '-cp', TOOLS / 'apktool.jar', '-d', cls, HERE / 'tools-src' / 'Asm.java'])
    run(['java', '-cp', f'{cls}{os.pathsep}{TOOLS / "apktool.jar"}', 'Asm', smali_dir, out_dex, str(MIN_SDK)])


def build_resources(assets, out_apk, res_dirs, manifest, version_code, version_name):
    aapt2 = TOOLS / 'aapt2'
    zips = []
    for i, d in enumerate(res_dirs):
        z = out_apk.parent / f'res{i}.zip'
        run([aapt2, 'compile', '--dir', d, '-o', z])
        zips.append(z)
    run([aapt2, 'link', '-o', out_apk, '-I', framework(), '--manifest', manifest,
         '--min-sdk-version', MIN_SDK, '--target-sdk-version', TARGET_SDK,
         '--version-code', version_code, '--version-name', version_name,
         '-A', assets] + zips + ['--auto-add-overlay'])


def zip_aligned(base_apk, dex, dst):
    stored = ('.arsc', '.png', '.woff2')
    with zipfile.ZipFile(base_apk) as zin, zipfile.ZipFile(dst, 'w') as zout:
        items = [(i.filename, zin.read(i.filename)) for i in zin.infolist() if not i.is_dir()]
        items.append(('classes.dex', dex.read_bytes()))
        items.sort(key=lambda kv: (kv[0] != 'AndroidManifest.xml', kv[0] != 'classes.dex', kv[0]))
        for name, data in items:
            zi = zipfile.ZipInfo(name, date_time=(2026, 1, 1, 0, 0, 0))
            if name.endswith(stored):
                zi.compress_type = zipfile.ZIP_STORED
                pad = (-(zout.fp.tell() + 30 + len(name.encode()))) % 4
                zi.extra = b'\x00' * pad
            else:
                zi.compress_type = zipfile.ZIP_DEFLATED
            zout.writestr(zi, data)


def ensure_keystore():
    if KEYSTORE.exists():
        return
    run(['keytool', '-genkeypair', '-keystore', KEYSTORE, '-storepass', KS_PASS, '-keypass', KS_PASS,
         '-alias', 'kari3d', '-keyalg', 'RSA', '-keysize', '2048', '-validity', '10000',
         '-dname', 'CN=Rune Warden 3D Kari, O=Personal'])


def build():
    info = APP
    out = OUT / info['id']
    out.mkdir(parents=True, exist_ok=True)
    assets = out / 'assets'
    stage_assets(assets)
    man = out / 'AndroidManifest.xml'
    man.write_text((HERE / 'AndroidManifest.xml').read_text().replace('@PACKAGE@', info['package']).replace('@LABEL@', info['app']))
    smali = out / 'smali'
    if smali.exists():
        shutil.rmtree(smali)
    shutil.copytree(HERE / 'smali', smali)
    for f in smali.rglob('*.smali'):
        f.write_text(f.read_text().replace('@FOLDER@', info['folder']))
    dex = out / 'classes.dex'
    assemble_dex(smali, dex)
    base = out / 'base.apk'
    build_resources(assets, base, [HERE / 'res', HERE / 'res-icons' / info['id']], man, info['versionCode'], info['versionName'])
    unsigned = out / 'unsigned.apk'
    zip_aligned(base, dex, unsigned)
    ensure_keystore()
    apk = out / (info['app'].lower().replace(' ', '-') + '.apk')
    run(['java', '-jar', TOOLS / 'apksigner.jar', 'sign', '--ks', KEYSTORE, '--ks-pass', f'pass:{KS_PASS}',
         '--key-pass', f'pass:{KS_PASS}', '--min-sdk-version', MIN_SDK,
         '--v2-signing-enabled', 'true', '--v3-signing-enabled', 'true', '--out', apk, unsigned])
    v = run(['java', '-jar', TOOLS / 'apksigner.jar', 'verify', '--verbose', '--min-sdk-version', MIN_SDK, apk])
    print(f"{info['app']}: {info['package']} {info['versionName']} ({info['versionCode']}) -> {apk} ({apk.stat().st_size // 1024} KB), "
          + ('signature verifies' if 'Verifies' in v else 'SIGNATURE PROBLEM'))


def main():
    OUT.mkdir(exist_ok=True)
    build()


if __name__ == '__main__':
    main()
