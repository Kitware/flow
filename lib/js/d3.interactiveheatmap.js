d3.chart = d3.chart || {};

/**
 * Heatmap chart for d3.js
 *
 * Usage:
 * var chart = d3.chart.heatmap();
 * d3.select('#chart')
 *   .datum(data)
 *   .call(chart);
 */

d3.chart.heatmap = function(options) {
  function createHeatmap(selection, rowLabelsData) {
    selection.each(function(data) {
      var rowSortOrder = false;
      var colSortOrder = false;

      var margin = {top: 40, right: 10, bottom: 10, left: 10};  // NOTE: Left margin will be adjusted to fit the largest row label
      var cellSize = 24;    // TODO: Should cells be square?

      var legendMargin = {top: 10, right: 10, bottom: 10, left: 10};
      var legendHeight = 30;
      var legendWidth = 200;

      //==================================================

      // Parse data
      var dataset = [];
      // Note: In the example .csv file each row is a patient and each column is a measurement...
      //       On the heatmap, want to display patients in COLUMNS and data in ROWS ?
      rowLabelsData.forEach(function(d, i) {
        dataset[i] = [];
      });
      data.forEach(function(d){
        // Convert all values from strings to numbers...
        rowLabelsData.forEach(function(key, i) {
          var val = (d[key] == "") ? NaN : +d[key];
          dataset[i].push(val);
        });
      });

      // Find min and max
      var min = d3.min(dataset, function(d) {
        return d3.min(d);
      });
      var max = d3.max(dataset, function(d) {
        return d3.max(d);
      });

      //==================================================

      // Create buttons
      // TODO: Add a margin and spacing
      var buttons = selection.append("div");
      var sortingOptions = {columnsAndRows: "Initial order on columns and rows", rows: "Initial order on rows", columns: "Initial order on columns"};

      buttons.append("button")
        .text(function(d) { return sortingOptions.columnsAndRows; })
        .attr("class", "columnsAndRowsButton")
        .on("click", function() { return changeOrder("columnsAndRows"); });

      buttons.append("button")
        .text(function(d) { return sortingOptions.rows; })
        .attr("class", "columnsAndRowsButton")
        .on("click", function() { return changeOrder("rows"); });

      buttons.append("button")
        .text(function(d) { return sortingOptions.columns; })
        .attr("class", "columnsAndRowsButton")
        .on("click", function() { return changeOrder("columns"); });

      //==================================================

      var numberOfRows = rowLabelsData.length;
      var numberOfColumns = dataset[0].length;

      var svg = selection.append("svg");

      // Calculate the width of the row labels
      var maxWidth = 0;
      svg.selectAll("text.foo").data(rowLabelsData)
        .enter().append("text").text(function(d) { return d; })
        .each(function(d) {
            maxWidth = Math.max(this.getBBox().width, maxWidth);
        })
        .remove();
      margin.left += maxWidth;

      var width = cellSize * numberOfColumns;
      var height = cellSize * numberOfRows;
      var heatmapY = margin.top + legendHeight + legendMargin.top + legendMargin.bottom;
      svg.attr("width", width + margin.left + margin.right)
        .attr("height", (height + 30) + heatmapY + (legendMargin.top + legendHeight + 30))   // TODO: Assuming labels have height of 30.
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

      createLegend(svg);

      svg = svg.append("g")
        .attr("transform", "translate(" + 0 + "," + heatmapY + ")");

      // Create a color scale
      var colors = ["#0000FF", "#FFFF00"] // blue ---> yellow
      var colorScale = d3.scale.linear()
        .domain([min, max])
        .range(colors);

      //==================================================

      // Create heatmap row-by-row
      var row = svg.selectAll(".row")
        .data(dataset)
        .enter().append("g")
        .attr("class", "row");

      var rowNumber = 0;
      var cells = row.selectAll(".cells")
        .data (function (d) {
          rowNumber++;
          return d;
        })
        .enter()
        .append("rect")
        .attr("x", function(d, columnNumber) {
          return columnNumber * cellSize;
        })
        .attr("y", function(d, columnNumber, rowNumber) {
          return rowNumber * cellSize;
        })
        .attr("class", function(d, columnNumber, rowNumber) {
          return "cell bordered cr" + rowNumber + " cc" + columnNumber;
        })
        .attr("row", function(d, columnNumber, rowNumber) {
          return rowNumber;
        })
        .attr("col", function(d, columnNumber, rowNumber) {
          return columnNumber;
        })
        .attr("width", cellSize)
        .attr("height", cellSize)
        .attr("fill", function(d) { return colorScale(d); })
        .on('mouseover', function(d, columnNumber, rowNumber) {
          d3.select('#colLabel_' + columnNumber).classed("hover", true);
          d3.select('#rowLabel_' + rowNumber).classed("hover", true);
        })
        .on('mouseout', function(d, columnNumber, rowNumber) {
          d3.select('#colLabel_' + columnNumber).classed("hover", false);
          d3.select('#rowLabel_' + rowNumber).classed("hover", false);
        })
        .append("title")  // Tooltip
        .text(function(d) {
          return d;
        });

      //==================================================

      // Labels
      var rowLabels = svg.append("g")
        .attr("class", "rowLabels")
        .selectAll(".rowLabel")
        .data(rowLabelsData)
        .enter().append("text")
        .text(function(d) {
          return d;
        })
        .attr("x", 0)
        .attr("y", function(d, i) {
          return (i * cellSize);
        })
        .style("text-anchor", "end")
        .attr("transform", function(d, i) {
            return "translate(-3," + cellSize / 1.5 + ")";
        })
        .attr("class", "rowLabel mono")
        .attr("id", function(d, i) {
          return "rowLabel_" + i;
        })
        .on('mouseover', function(d, i) {
          d3.select('#rowLabel_' + i).classed("hover", true);
        })
        .on('mouseout', function(d, i) {
          d3.select('#rowLabel_' + i).classed("hover", false);
        })
        .on("click", function(d, i) {
          rowSortOrder = !rowSortOrder;
          sortByValues("r", i, rowSortOrder);
          d3.select("#order").property("selectedIndex", 0);
        });

      var columnLabelsData = d3.range(numberOfColumns);         // TODO: Labels other than numbers?
      var colLabels = svg.append("g")
        .attr("class", "colLabels")
        .selectAll(".colLabel")
        .data(columnLabelsData)
        .enter().append("text")
        .text(function(d) { return d; })
        .attr("x", 0)
        .attr("y", function(d, i) {
          return (i * cellSize);
        })
        .style("text-anchor", "left")
        .attr("transform", function(d, i) {
          return "translate(" + cellSize / 2 + ", -3) rotate(-90) rotate(45, 0, " + (i * cellSize) + ")";
        })
        .attr("class", "colLabel mono")
        .attr("id", function(d, i) {
          return "colLabel_" + i;
        })
        .on('mouseover', function(d, i) {
          d3.select('#colLabel_' + i).classed("hover", true);
        })
        .on('mouseout', function(d, i) {
          d3.select('#colLabel_' + i).classed("hover", false);
        })
        .on("click", function(d, i) {
          colSortOrder = !colSortOrder;
          sortByValues("c", i, colSortOrder);
          d3.select("#order").property("selectedIndex", 0);
        });

      //==================================================

      function createLegend(svg) {
        var svg = svg.append("g");

        var gradient = svg.append("svg:defs")
          .append("svg:linearGradient")
          .attr("id", "gradient")
          .attr("x1", "0%")
          .attr("y1", "0%")
          .attr("x2", "100%")
          .attr("y2", "0%")
          .attr("spreadMethod", "pad");

        gradient.append("svg:stop")
          .attr("offset", "0%")
          .attr("stop-color", "#0000FF")  // blue
          .attr("stop-opacity", 1);

        gradient.append("svg:stop")
          .attr("offset", "100%")
          .attr("stop-color", "#FFFF00")  // yellow
          .attr("stop-opacity", 1);

        svg.append("rect")
          .attr("class", "legend")
          .attr("width", legendWidth)
          .attr("height", legendHeight)
          .style("fill", "url(#gradient)")
          .attr("stroke-width", 1)
          .attr("stroke", "black");

        var legendScale = d3.scale.linear()
          .domain([min, max])
          .range([0, legendWidth]);

        var tickmarks = d3.svg.axis()
          .scale(legendScale)
          .orient("bottom")
          .ticks(5);

        var xAxis = svg.append("g")
          .attr("class", "x axis")
          .attr("transform", "translate(0," + legendHeight + ")")
          .call(tickmarks);

        var bbox = xAxis.node().getBBox();  // Get x-axis dimensions

        svg.append("text")
          .attr("class", "legend label")
          .attr("text-anchor", "middle")
          .style("font-size", "16px")
          .attr("x", legendWidth / 2)
          .attr("y", legendHeight + bbox.height)
          .attr("dy", "1.0em")  // Allow small margin between text and x-axis
          .text(""); // TODO: Read this from the input file?
      }

      //==================================================

      // Change ordering of cells
      function sortByValues(rORc, i, sortOrder) {
        var t = svg.transition().duration(1000);
        var values = [];
        var sorted;
        d3.selectAll(".c" + rORc + i)
          .filter(function(d) {
            values.push(d); // TODO: Handle NaN or other invalid values?
          });

        if (rORc == "r") { // sort on columns
          sorted = d3.range(numberOfColumns).sort(function(a, b) {
            if (sortOrder) {
              return values[b] - values[a];
            } else {
              return values[a] - values[b];
            }
          });
          t.selectAll(".cell")
            .attr("x", function(d) {
              var col = parseInt(d3.select(this).attr("col"));
              return sorted.indexOf(col) * cellSize;
            });
          t.selectAll(".colLabel")
            .attr("y", function(d, i) {
              return sorted.indexOf(i) * cellSize;
            })
            .attr("transform", function(d, i) {
              return "translate(" + cellSize / 2 + ", -3) rotate(-90) rotate(45, 0, " + (sorted.indexOf(i) * cellSize) + ")";
            });
        } else { // sort on rows
          sorted = d3.range(numberOfRows).sort(function(a, b) {
            if (sortOrder) {
              return values[b] - values[a];
            } else {
              return values[a] - values[b];
            }
          });
          t.selectAll(".cell")
            .attr("y", function(d) {
              var row = parseInt(d3.select(this).attr("row"));
              return sorted.indexOf(row) * cellSize;
            });
          t.selectAll(".rowLabel")
            .attr("y", function(d, i) {
              return sorted.indexOf(i) * cellSize;
            })
            .attr("transform", function(d, i) {
              return "translate(-3," + cellSize / 1.5 + ")";
            });
        }
      }

      //==================================================

      function changeOrder(newOrder) {
        var t = svg.transition().duration(1000);
        if (newOrder == "columns") { // initial sort on columns
          sortColumns();
        } else if (newOrder == "rows") { // initial sort on rows
          sortRows();
        } else if (newOrder == "columnsAndRows") { // initial sort on rows and columns
          t.selectAll(".cell")
            .attr("x", function(d) {
              var col = parseInt(d3.select(this).attr("col"));
              return col * cellSize;
            })
            .attr("y", function(d) {
              var row = parseInt(d3.select(this).attr("row"));
              return row * cellSize;
            });
          t.selectAll(".colLabel")
            .attr("y", function(d, i) {
              return i * cellSize;
            })
            .attr("transform", function(d, i) {
              return "translate(" + cellSize / 2 + ", -3) rotate(-90) rotate(45, 0, " + (i * cellSize) + ")";
            });
          t.selectAll(".rowLabel")
            .attr("y", function(d, i) {
              return i * cellSize;
            })
            .attr("transform", function(d, i) {
              return "translate(-3," + cellSize / 1.5 + ")";
            });
        }
      }

      function sortColumns() {
        var t = svg.transition().duration(1000);
        t.selectAll(".cell")
          .attr("x", function(d) {
            var col = parseInt(d3.select(this).attr("col"));
            return col * cellSize;
          });
        t.selectAll(".colLabel")
          .attr("y", function(d, i) {
            return i * cellSize;
          })
          .attr("transform", function(d, i) {
            return "translate(" + cellSize / 2 + ", -3) rotate(-90) rotate(45, 0, " + (i * cellSize) + ")";
          });
      }

      function sortRows() {
        var t = svg.transition().duration(1000);
        t.selectAll(".cell")
          .attr("y", function(d) {
            var row = parseInt(d3.select(this).attr("row"));
            return row * cellSize;
          });
        t.selectAll(".rowLabel")
          .attr("y", function(d, i) {
            return i * cellSize;
          })
          .attr("transform", function(d, i) {
            return "translate(-3," + cellSize / 1.5 + ")";
          });
      }
    });
  }

  return createHeatmap;
};

