import vtk
import requests

# to support alternative baseURL
import os
import os.path

def add_arguments(parser):
    parser.add_argument("--table", help="URI to serialized vtkTable", dest="tableURI")
    parser.add_argument("--tree", help="URI to serialized vtkTree", dest="treeURI")
    parser.add_argument("--width", help="desired width of render window", dest="width")
    parser.add_argument("--height", help="desired height of render window", dest="height")
    parser.add_argument("--baseURL", help="the protocol, hostname, and port of the girder instance", dest="baseURL")

def initialize(self, VTKWebApp, args):
    # Create default pipeline (Only once for all the session)
    if not VTKWebApp.view:

        baseURL = args.baseURL
        # support for overriding the base URL
        scriptDir = os.path.dirname(os.path.realpath(__file__))
        configPath = scriptDir + "/baseURL.txt"
        if os.path.isfile(configPath):
          f = file(configPath, "r")
          baseURL = f.read().rstrip()
          f.close()

        # get our input data from romanesco
        r = requests.get(baseURL + args.tableURI, verify=False)
        tableJSON = r.json()
        tableStr = tableJSON["data"]
        r = requests.get(baseURL + args.treeURI, verify=False)
        treeJSON = r.json()
        treeStr = treeJSON["data"]

        # deserialize our input data
        tableReader = vtk.vtkTableReader()
        tableReader.ReadFromInputStringOn()
        tableReader.SetInputString(tableStr, len(tableStr))
        tableReader.Update()
        table = tableReader.GetOutput()
        treeReader = vtk.vtkTreeReader()
        treeReader.ReadFromInputStringOn()
        treeReader.SetInputString(treeStr, len(treeStr))
        treeReader.Update()
        tree = treeReader.GetOutput()

        # create our visualization item and load the data into it.
        treeHeatmapItem = vtk.vtkTreeHeatmapItem()
        treeHeatmapItem.SetTree(tree)
        treeHeatmapItem.SetTable(table)

        # detect if we are visualizing the results of a tree comparison
        if tree.GetVertexData().GetArray("property.differences"):
            treeHeatmapItem.GetDendrogram().SetColorArray("property.differences")
            treeHeatmapItem.GetDendrogram().SetLineWidth(2.0)

        # setup the window
        view = vtk.vtkContextView()
        view.GetRenderWindow().SetSize(int(args.width), int(args.height))
        view.GetRenderer().SetBackground(1,1,1)

        iren = view.GetInteractor()
        iren.SetRenderWindow(view.GetRenderWindow())

        transformItem = vtk.vtkContextTransform()
        transformItem.AddItem(treeHeatmapItem)
        transformItem.SetInteractive(1)

        view.GetScene().AddItem(transformItem)
        view.GetRenderWindow().SetMultiSamples(0)

        iren.Initialize()
        view.GetRenderWindow().Render()

        # adjust zoom so the item nicely fills the screen
        itemSize = [0, 0]
        treeHeatmapItem.GetSize(itemSize)

        itemSize.append(0)
        transformItem.GetTransform().MultiplyPoint(itemSize, itemSize)

        newWidth = view.GetScene().GetSceneWidth()
        newHeight = view.GetScene().GetSceneHeight()

        pageWidth = newWidth
        pageHeight = newHeight
        sx = pageWidth  / itemSize[0]
        sy = pageHeight / itemSize[1]
        if sy < sx:
           scale = sy;
        else:
           scale = sx;

        if scale > 1:
           scale = scale * 0.5
        else:
           scale = scale * 0.9

        transformItem.Scale(scale, scale)

        # center the item within the screen
        itemCenter = [0, 0]
        treeHeatmapItem.GetCenter(itemCenter)
        itemCenter.append(0)

        centerPt = vtk.vtkPoints2D()
        centerPt.InsertNextPoint(newWidth / 2.0, newHeight / 2.0)
        transformItem.GetTransform().InverseTransformPoints(centerPt, centerPt)
        sceneCenter = [0, 0]
        centerPt.GetPoint(0, sceneCenter)

        dx = -1 * (itemCenter[0] - sceneCenter[0])
        dy = -1 * (itemCenter[1] - sceneCenter[1])

        transformItem.Translate(dx, dy)

        # VTK Web application specific
        VTKWebApp.view = view.GetRenderWindow()
        self.Application.GetObjectIdMap().SetActiveObject("VIEW", view.GetRenderWindow())

