============================
    Creating an Analysis
============================

For an overview of this process, see
the `demonstration video <http://youtu.be/n2M5F0EjISg>`_.

To create an analysis, start with the following steps:

* Log in to TangeloHub (or first register for an account).
* Navigate to the Data Management tab.
* Click the pencil icon on the left for the collection you want
  to add an analysis to. If you do not have edit permissions on
  any collection, contact kitware@kitware.com to request access
  with your TangeloHub user name, organization,
  and desired use case.
* Navigate to the Analysis tab.
* Under "Create new analysis", enter an analysis name and
  click the "New analysis" button. A new empty analysis
  will now be saved and selected in the Analysis drop-down menu.
* Click the "Show script" and "Edit" buttons to show an
  editable script view in the main window.
* Select the language (Python or R) that you desire for your script.

At this point you will have a place to begin writing your Arbor script.
You must now decide what input and output types you require,
and what formats you expect them to be in.
Inputs will be imported into the namespace of the script as variables
before the script executes. Outputs are variable names expected to be
present after the script runs at which point it will be exported from
the script environment.

To add an input, click the plus button next to "Inputs" and enter the
name (which must match the script variable name), type, description,
and default value. The type represents both the high-level data type
(table, tree, string, number, etc.) and format (CSV string, array of
dictionaries, R dataframe, etc.) of the input variable in the script.
Romanesco, the script execution engine used by Arbor, supports many
types and formats described in this
`documented list <http://romanesco.readthedocs.org/en/latest/types-and-formats.html>`_.
There are two additional properties specific to string inputs.
Enter a value in "Comma-separated list of values" if your string
input has a fixed set of named values. The interface for such a
parameter will be presented as a drop-down list selection.
Use "Input for column names" if a string input should represent
a column name from another tabular input. In that case, enter the name
of the table input. The input will be presented to the user as a
drop-down list of column names from that table.

To add an output, click on the plus button next to "Outputs" and enter
the name (which must match the script variable name), type, and description.
Similar to inputs, the type must specify the type and format of the variable
upon completion of the script.

The final step is to enter the script itself. Start with any required
library imports, and enter your script as a simple set of commands as
would be entered from the language shell. Use input variables as if they
have already been assigned a value, and be sure to create output variables
whose names match each of your output names.

**Note:** After any changes are made, be sure to click the "Save" button
to ensure your latest version is saved. Analysis runs will
always be performed against the saved version, so be sure
to click "Save" before running a new version of your analysis.
