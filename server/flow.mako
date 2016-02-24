<!DOCTYPE html>
<html lang="en">
  <head>
    <title>Flow</title>
    <link rel="stylesheet" href="//fonts.googleapis.com/css?family=Droid+Sans:400,700">
    <link rel="stylesheet" href="static/built/girder.ext.min.css">
    <link rel="stylesheet" href="static/built/fontello/css/fontello.css">
    <link rel="stylesheet" href="static/built/app.min.css">
    <link rel="stylesheet" href="static/built/plugins/flow/plugin.min.css">
    <link rel="stylesheet" href="static/built/plugins/flow/flow.ext.min.css">
  </head>
  <body>
    <div style="width:100%;height:100%" class="container">
      <div id="intro">
        <div class="row text-center"><img src="static/img/${brand}.png" alt="Logo" class="img-rounded"></div>
        <div class="row">
          <p class="lead text-center">Use the panel below to visualize, analyze, or manage your data.</p>
        </div>
      </div>
      <div id="vis" class="hidden"></div>
      <div id="editor" class="hidden">
        <div id="code-editor" class="hidden"></div>
        <div id="workflow-editor" class="hidden"></div>
      </div>
    </div>
    <div id="control-panel">
      <div class="container">
        <div class="row login-view">
          <div class="col-sm-12"><span id="logged-in"><span id="name"></span>&nbsp;<a id="logout" href="#">Log Out</a></span><span id="logged-out"><a id="login" href="#">Log In</a> or&nbsp;<a id="register" href="#">Register</a></span></div>
        </div>
        <ul class="nav nav-tabs">
          <li class="active"><a href="#data_tab" data-toggle="tab">Data Management</a></li>
          <li><a href="#analysis_tab" data-toggle="tab">Analysis</a></li>
          <li><a href="#vis_tab" data-toggle="tab">Visualization</a></li>
        </ul>
      </div>
      <div class="tab-content">
        <div id="data_tab" class="tab-pane active">
          <div class="container">
            <div id="dataset-management">
              <div class="row">
                <div class="col-sm-6">
                  <div id="upload" class="btn btn-primary"><i class="glyphicon icon-doc-inv"></i> Browse or drop files</div>
                  <div class="form-group hide">
                    <input id="g-files" type="file" multiple="multiple">
                  </div>
                  <div class="form-inline spacer hidden new-collection-form">
                    <input placeholder="Name" type="text" class="form-control new-collection-name">
                    <div class="checkbox">
                      <label>
                        <input type="checkbox" class="new-collection-public"> Public
                      </label>
                    </div>
                    <button class="btn btn-primary new-collection"><span class="glyphicon icon-plus"></span> New collection</button>
                  </div>
                </div>
                <div class="col-sm-6">
                  <ul id="collections" class="list-group"></ul>
                </div>
              </div>
              <div class="row">
                <div class="col-sm-12">
                  <label>Save or download data</label>
                  <div class="form-inline">
                    <select class="form-control datasets"></select>
                    <button class="dataset-quick-view btn btn-primary">Quick view</button><span class="dataset-save-form">
                      <input type="text" placeholder="Name" class="dataset-name form-control">
                      <select class="dataset-format-select form-control"></select>
                      <button class="dataset-download btn btn-primary">Download</button>
                      <button class="dataset-save btn btn-primary hidden">Save to checked collection</button></span>
                    <button title="Delete dataset" class="dataset-delete btn btn-default"><span class="glyphicon icon-trash"></span></button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div id="analysis_tab" class="tab-pane">
          <div id="analysis-management" class="container">
            <div class="row">
              <div class="col-sm-6">
                <div class="form-group">
                  <label for="analysis">Select analysis</label>
                  <select id="analysis" class="form-control"></select>
                </div>
              </div>
              <div class="col-sm-6">
                <div id="new-analysis-form" class="hidden">
                  <label>Create new analysis</label>
                  <div class="form-inline">
                    <div id="analysis-upload" class="btn btn-primary">Upload ...</div>
                    <div class="form-group hide">
                      <input id="analysis-files" type="file" multiple="multiple">
                    </div>
                    <input id="analysis-name" placeholder="Name" type="text" class="form-control">
                    <button id="analysis-new" class="btn btn-primary"><span class="glyphicon icon-plus"></span> New analysis</button>
                    <button id="workflow-new" class="btn btn-primary"><span class="glyphicon icon-plus"></span> New workflow</button>
                  </div>
                </div>
              </div>
            </div>
            <div class="row description-container hide">
              <div class="col-sm-12">
                <div id="analysis-description"></div>
              </div>
            </div>
            <div class="row spacer"></div>
            <div id="analysis-form" class="form-inline">
              <button id="setup" class="btn btn-primary"><span id="run-icon" class="glyphicon icon-play"></span> Setup and run</button>
              <button id="analysis-download" class="btn btn-primary">Download</button>
              <button id="show-script" data-toggle="button" class="btn btn-default"><span id="show-script-icon" class="glyphicon icon-eye"></span>&nbsp;<span id="show-script-text">Show script</span></button>
              <button id="edit" data-toggle="button" class="btn btn-default hidden"><span class="glyphicon icon-edit"></span> Edit</button><span class="edit-controls hidden">
                <input placeholder="Name" type="text" class="form-control analysis-edit-name"><span class="analysis-edit-controls">
                  <select id="mode" class="form-control">
                    <option value="r">R</option>
                    <option value="python">Python</option>
                  </select></span>
                <button id="save" class="btn btn-default"><span class="glyphicon icon-save"></span> Save</button>
                <button title="Delete analysis" class="delete-analysis btn btn-default"><span class="glyphicon icon-trash"></span></button></span>
            </div>
            <div class="row spacer edit-controls">
              <div class="col-sm-6 workflow-edit-controls">
                <div class="form-group">
                  <label for="workstep">Select analysis</label>
                  <select id="workstep" class="form-control"></select>
                </div>
                <button id="add-workstep" class="btn btn-primary"><span class="glyphicon icon-plus"></span>Add to workflow</button>
                <div class="form-group">
                  <label for="workvis">Select visualization</label>
                  <select id="workvis" class="form-control"></select>
                </div>
                <button id="add-workvis" class="btn btn-primary"><span class="glyphicon icon-plus"></span>Add to workflow</button>
              </div>
            </div>
            <div class="row edit-controls">
              <div class="col-sm-12">
                <div class="form-group">
                  <label for="analysis-edit-description">Description</label>
                  <textarea id="analysis-edit-description" class="form-control"></textarea>
                </div>
              </div>
            </div>
            <div class="row spacer edit-controls">
              <div class="col-sm-6 analysis-edit-controls">
                <label>Inputs</label>
                <button class="btn btn-sm btn-link"><span class="glyphicon icon-plus add-input-variable"></span></button>
                <div class="input-variables"></div>
              </div>
              <div class="col-sm-6 analysis-edit-controls">
                <label>Outputs</label>
                <button class="btn btn-sm btn-link"><span class="glyphicon icon-plus add-output-variable"></span></button>
                <div class="output-variables"></div>
              </div>
            </div>
          </div>
        </div>
        <div id="vis_tab" class="tab-pane">
          <div id="visualization-management" class="container">
            <div class="row">
              <div class="col-sm-6">
                <div class="form-group">
                  <label for="visualization">Select visualization</label>
                  <select class="form-control visualizations"></select>
                </div>
              </div>
              <div class="col-sm-6">
                <div class="inputs"></div>
              </div>
            </div>
            <div class="form-inline">
              <button class="btn btn-primary show-visualization"><span class="glyphicon icon-chart-bar show-icon"></span><span class="show-text"> Update</span></button>
              <button class="btn btn-primary add-to-presets"><span class="glyphicon icon-plus"></span><span> Add to presets</span></button>
            </div>
            <div class="row">
              <div class="col-sm-6">
                <div class="form-group">
                  <label for="presets">Select preset visualization</label>
                  <select class="form-control presets"></select>
                </div>
              </div>
            </div>
            <div class="form-inline">
              <button class="btn btn-primary show-preset"><span class="glyphicon icon-chart-bar"></span><span> Show</span></button>
              <button class="btn btn-primary save hidden"><span class="glyphicon icon-save"></span><span> Save to checked collection</span></button>
            </div>
            <div class="row">
              <div class="col-sm-12">
                <pre class="hidden">#prov</pre>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="row spacer">
        <div class="col-sm-12"></div>
      </div>
    </div>
    <div id="analysis-setup-dialog" tabindex="-1" role="dialog" class="modal fade">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <button type="button" data-dismiss="modal" aria-hidden="true" class="close">&times;</button>
            <h4 class="modal-title analysis-setup-title"></h4>
          </div>
          <div class="modal-body">
            <div class="analysis-setup-description"></div>
            <div class="analysis-setup-outputs-container"></div>
            <pre class="bg-success success-message hidden"></pre>
            <pre class="bg-info info-message hidden"></pre>
            <pre class="bg-danger error-message hidden"></pre>
            <div class="inputs"></div>
            <button class="btn btn-primary run"><span class="glyphicon icon-play run-icon"></span> Run</button>
            <button id="close-analysis-setup" data-dismiss="modal" class="btn btn-default">Close</button>
            <button id="show-output" data-toggle="button" class="btn btn-default pull-right"><span id="show-output-icon" class="glyphicon icon-eye"></span>&nbsp;<span id="show-output-text">Show output log</span></button>
            <pre id="analysis-output" class="hidden"></pre>
          </div>
        </div>
      </div>
    </div>
    <div id="input-variable-edit-dialog" tabindex="-1" role="dialog" class="modal fade">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <button type="button" data-dismiss="modal" aria-hidden="true" class="close">&times;</button>
            <h4 class="modal-title">Configure input</h4>
          </div>
          <div class="modal-body">
            <div class="properties"></div>
            <button class="btn btn-primary update">Update</button>
            <button data-dismiss="modal" class="btn btn-default">Close</button>
          </div>
        </div>
      </div>
    </div>
    <div id="output-variable-edit-dialog" tabindex="-1" role="dialog" class="modal fade">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <button type="button" data-dismiss="modal" aria-hidden="true" class="close">&times;</button>
            <h4 class="modal-title">Configure output</h4>
          </div>
          <div class="modal-body">
            <div class="properties"></div>
            <button class="btn btn-primary update">Update</button>
            <button data-dismiss="modal" class="btn btn-default">Close</button>
          </div>
        </div>
      </div>
    </div>
    <div id="workflow-input-variable-edit-dialog" tabindex="-1" role="dialog" class="modal fade">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <button type="button" data-dismiss="modal" aria-hidden="true" class="close">&times;</button>
            <h4 class="modal-title">Configure input</h4>
          </div>
          <div class="modal-body">
            <div class="properties"></div>
            <button class="btn btn-primary update">Update</button>
            <button data-dismiss="modal" class="btn btn-default">Close</button>
          </div>
        </div>
      </div>
    </div>
    <div id="workflow-output-variable-edit-dialog" tabindex="-1" role="dialog" class="modal fade">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <button type="button" data-dismiss="modal" aria-hidden="true" class="close">&times;</button>
            <h4 class="modal-title">Configure output</h4>
          </div>
          <div class="modal-body">
            <div class="properties"></div>
            <button class="btn btn-primary update">Update</button>
            <button data-dismiss="modal" class="btn btn-default">Close</button>
          </div>
        </div>
      </div>
    </div>
    <div id="workflow-task-edit-dialog" tabindex="-1" role="dialog" class="modal fade">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <button type="button" data-dismiss="modal" aria-hidden="true" class="close">&times;</button>
            <h4 class="modal-title">Configure task</h4>
          </div>
          <div class="modal-body">
            <div class="properties"></div>
            <button class="btn btn-primary update">Update</button>
            <button data-dismiss="modal" class="btn btn-default">Close</button>
          </div>
        </div>
      </div>
    </div>
    <div id="confirm-delete" tabindex="-1" role="dialog" class="modal fade">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <button type="button" data-dismiss="modal" aria-hidden="true" class="close">&times;</button>
            <h4 class="modal-title">Confirm delete</h4>
          </div>
          <div class="modal-body">
            <This>analysis will be permanently deleted. Continue?</This>
          </div>
          <div class="modal-footer">
            <button data-dismiss="modal" class="btn btn-default">Cancel</button>
            <button class="btn btn-danger really-delete-analysis">Delete</button>
          </div>
        </div>
      </div>
    </div>
    <div id="alert_placeholder" class="hidden"></div>
    <div id="g-dialog-container" class="modal fade"></div>
    <div id="th-dialog-container" class="modal fade"></div>
    <div id="template-container" class="hidden">
      <div id="variable-template"><span title="Edit variable" class="edit glyphicon icon-pencil"></span>&nbsp;<span class="name"></span>&nbsp;<span title="Delete variable" class="delete glyphicon icon-trash pull-right"></span></div>
    </div>
    <script src="static/built/plugins/flow/libs.min.js" charset="utf-8"></script>
    <script src="static/built/plugins/flow/ace.min.js" charset="utf-8"></script>
    <script src="static/built/app.min.js" charset="utf-8"></script>
    <script src="static/built/plugins/flow/app.min.js" charset="utf-8"></script>
    <script src="static/built/plugins/flow/main.min.js" charset="utf-8"></script>
  </body>
</html>
