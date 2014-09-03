import vtk
import requests

# to support alternative baseURL
import os
import os.path

def add_arguments(parser):
    parser.add_argument("--tree1", help="URI to serialized vtkTree", dest="tree1URI")
    parser.add_argument("--tree2", help="URI to serialized vtkTree", dest="tree2URI")
    parser.add_argument("--table", help="URI to table in .csv format", dest="tableURI")
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
        r = requests.get(baseURL + args.tree1URI, verify=False)
        tree1JSON = r.json()
        tree1Str = tree1JSON["data"]
        r = requests.get(baseURL + args.tree2URI, verify=False)
        tree2JSON = r.json()
        tree2Str = tree2JSON["data"]
        r = requests.get(baseURL + args.tableURI, verify=False)
        tableJSON = r.json()
        tableStr = tableJSON["data"]

        # get the tree names (TODO: consider better ways to get this info)
        tree1LabelURI = args.tree1URI[0:args.tree1URI.find("romanesco")]
        r = requests.get(baseURL + tree1LabelURI, verify=False)
        tree1LabelJSON = r.json()
        tree1Label = tree1LabelJSON["name"]
        tree1Label = tree1Label[0:tree1Label.find(".")]

        tree2LabelURI = args.tree2URI[0:args.tree2URI.find("romanesco")]
        r = requests.get(baseURL + tree2LabelURI, verify=False)
        tree2LabelJSON = r.json()
        tree2Label = tree2LabelJSON["name"]
        tree2Label = tree2Label[0:tree2Label.find(".")]

        # convert our input data into deserialized VTK objects
        tree1Reader = vtk.vtkTreeReader()
        tree1Reader.ReadFromInputStringOn()
        tree1Reader.SetInputString(tree1Str, len(tree1Str))
        tree1Reader.Update()
        tree1 = tree1Reader.GetOutput()

        tree2Reader = vtk.vtkTreeReader()
        tree2Reader.ReadFromInputStringOn()
        tree2Reader.SetInputString(tree2Str, len(tree2Str))
        tree2Reader.Update()
        tree2 = tree2Reader.GetOutput()

        tableReader = vtk.vtkDelimitedTextReader()
        tableReader.ReadFromInputStringOn()
        tableReader.SetInputString(tableStr, len(tableStr))
        tableReader.SetHaveHeaders(True)
        tableReader.DetectNumericColumnsOn()
        tableReader.ForceDoubleOn()
        table = tableReader.GetOutput()
        tableReader.Update()

        # create our visualization item and load the data into it.
        tanglegram = vtk.vtkTanglegramItem()
        tanglegram.SetTree1(tree1)
        tanglegram.SetTree2(tree2)
        tanglegram.SetTable(table)
        tanglegram.SetTree1Label(tree1Label)
        tanglegram.SetTree2Label(tree2Label)
        tanglegram.SetCorrespondenceLineWidth(4.0)
        tanglegram.SetTreeLineWidth(2.0)

        # setup the window
        view = vtk.vtkContextView()
        view.GetRenderWindow().SetSize(int(args.width), int(args.height))
        view.GetRenderer().SetBackground(1,1,1)

        iren = view.GetInteractor()
        iren.SetRenderWindow(view.GetRenderWindow())

        transformItem = vtk.vtkContextTransform()
        transformItem.AddItem(tanglegram)
        transformItem.SetInteractive(1)

        view.GetScene().AddItem(transformItem)
        view.GetRenderWindow().SetMultiSamples(0)

        iren.Initialize()
        view.GetRenderWindow().Render()

        # VTK Web application specific
        VTKWebApp.view = view.GetRenderWindow()
        self.Application.GetObjectIdMap().SetActiveObject("VIEW", view.GetRenderWindow())

