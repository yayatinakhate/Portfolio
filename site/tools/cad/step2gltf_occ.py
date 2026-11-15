"""STEP -> raw .glb with native OpenCascade (keeps part colours and names).
usage: python step2gltf_occ.py in.step out.glb [linear_deflection_mm=0.6] [angular_rad=0.35]"""
import sys, time
from OCP.STEPCAFControl import STEPCAFControl_Reader
from OCP.TDocStd import TDocStd_Document
from OCP.TCollection import TCollection_ExtendedString, TCollection_AsciiString
from OCP.XCAFDoc import XCAFDoc_DocumentTool
from OCP.XCAFApp import XCAFApp_Application
from OCP.IFSelect import IFSelect_RetDone
from OCP.OCP.collections import Sequence_TDF_Label as TDF_LabelSequence, IndexedDataMap_TCollection_AsciiString_TCollection_AsciiString as FileInfo
from OCP.BRepMesh import BRepMesh_IncrementalMesh
from OCP.RWGltf import RWGltf_CafWriter
from OCP.Message import Message_ProgressRange

src, out = sys.argv[1], sys.argv[2]
lin = float(sys.argv[3]) if len(sys.argv) > 3 else 0.6
ang = float(sys.argv[4]) if len(sys.argv) > 4 else 0.35
t0 = time.time()

app = XCAFApp_Application.GetApplication_s()
doc = TDocStd_Document(TCollection_ExtendedString("MDTV-XCAF"))
app.InitDocument(doc)
reader = STEPCAFControl_Reader()
reader.SetColorMode(True); reader.SetNameMode(True); reader.SetLayerMode(False)
if reader.ReadFile(src) != IFSelect_RetDone:
    sys.exit("could not read STEP")
reader.Transfer(doc)
print(f"read in {time.time() - t0:.1f} s", flush=True)

tool = XCAFDoc_DocumentTool.ShapeTool_s(doc.Main())
labels = TDF_LabelSequence(); tool.GetFreeShapes(labels)
for i in range(1, labels.Length() + 1):
    shape = tool.GetShape_s(labels.Value(i))
    BRepMesh_IncrementalMesh(shape, lin, False, ang, True)
print(f"meshed {labels.Length()} top-level shape(s) in {time.time() - t0:.1f} s", flush=True)

writer = RWGltf_CafWriter(TCollection_AsciiString(out), True)
ok = writer.Perform(doc, FileInfo(), Message_ProgressRange())
print(f"wrote {out}: {'ok' if ok else 'FAILED'} in {time.time() - t0:.1f} s", flush=True)
