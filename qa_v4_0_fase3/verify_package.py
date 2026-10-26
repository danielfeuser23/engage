"""Verify the preserved Fase 3 package with Python's standard library."""
from pathlib import Path, PurePosixPath
import hashlib, json, zipfile
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
PACKAGE = ROOT / "dist/Mobilize_Banco_N1_RPG_Pixel_v4_0_FASE_3_SCORM_1_2.zip"
COURSE = ROOT / "v4_0_fase3"
EXPECTED = "f299a6951531ccffa99cb2a2cfc78d1e4127cbd7f4c73ab7f0e4b81076ae9bef"

def sha(data):
    return hashlib.sha256(data).hexdigest()

def main():
    assert sha(PACKAGE.read_bytes()) == EXPECTED, "Package SHA-256 differs"
    snapshot = json.loads((ROOT / "docs/evidencias/fase3/runtime_hashes.json").read_text())
    with zipfile.ZipFile(PACKAGE) as archive:
        assert archive.testzip() is None, "ZIP CRC failed"
        names = archive.namelist()
        assert len(names) == len(set(names)) == 202, "Unexpected entries"
        assert all(not n.startswith("/") and ".." not in PurePosixPath(n).parts for n in names), "Unsafe path"
        assert set(names) == set(snapshot), "Snapshot path mismatch"
        manifest = ET.fromstring(archive.read("imsmanifest.xml"))
        files = [node.attrib["href"] for node in manifest.iter() if node.tag.rsplit("}", 1)[-1] == "file"]
        assert len(files) == len(set(files)) == 201, "Manifest file mismatch"
        assert set(files) == set(names) - {"imsmanifest.xml"}, "Manifest/path mismatch"
        for name in names:
            data = archive.read(name)
            assert (COURSE / name).read_bytes() == data, f"Source mismatch: {name}"
            assert sha(data) == snapshot[name], f"Snapshot mismatch: {name}"
    print(json.dumps({"passed": True, "files": 202, "manifest_refs": 201, "sha256": EXPECTED}))

if __name__ == "__main__":
    main()
