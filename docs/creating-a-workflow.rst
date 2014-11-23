===========================
    Creating a Workflow
===========================

A workflow is an analysis made up of other analyses chained together.
Similar to script-based analyses, you must first do the following:

* Log in to TangeloHub (or first register for an account).
* Navigate to the Data Management tab.
* Click the pencil icon on the left for the collection you want
  to add an analysis to. If you do not have edit permissions on
  any collection, `contact Kitware <http://www.tangelohub.org/contact-us/>`_
  to request access with your user name, organization,
  and desired use case.
* Navigate to the Analysis tab.
* Under "Create new analysis", enter an analysis name and
  click the "New workflow" button (not the "New analysis" button,
  which is for creating scripts).
  A new empty workflow will now be saved and selected in
  the Analysis drop-down menu.
* Click the "Show script" and "Edit" buttons to show an
  editable workflow view in the main window.

At this point you will have a blank canvas for building your workflow.
To add an item to the workflow, select an analysis from the *lower*
"Select analysis" drop-down menu. (The upper "Select analysis" drop-down
menu will switch over to editing a completely different analysis.)
Once a desired analysis is selected, click "Add to workflow," which
will add an analysis step box to your workflow diagram. Inputs
appear as knobs on the left, while outputs appear as knobs on the
right.

To connect analyses in the workflow, drag from an output knob of
one analysis to an input knob of another. To expose an analysis
input as a workflow input, click on an input knob and an input
box will appear. To expose an analysis output as a workflow output,
click on an output knob and an output box will appear.

.. note:: Upon completing your workflow, you must ensure that all input knobs
   have an incoming connection for the workflow to function properly.

.. note:: After any changes are made, be sure to click the "Save" button
   to ensure your latest version is saved. Analysis runs will
   always be performed against the saved version, so be sure
   to click "Save" before running a new version of your analysis.

.. warning:: It is undefined behavior to expose a string input that was defined
   to be a column from another table, unless that table is also an input.
   It is undefined because when setting up the analysis, the system does
   not know what the table's columns will be.
