d3.scatterplot = d3.scatterplot || {};

/**
 * Scatter plot matrix for d3.js
 *
 * Usage:
 * var matrix = d3.scatterplot.matrix();
 * d3.select('#matrix')
 *   .datum(data)
 *   .call(matrix);
 */

d3.scatterplot.matrix = function(options) {

  function matrix(selection, yLabel) {
    selection.each(function(data) {
      // First convert all values from strings to numbers...
      var keys = d3.keys(data[0]);
      data.forEach(function(d) {
        keys.forEach(function(key) {
          if (d[key] == "") { d[key] = NaN; }
          else { d[key] = +d[key]; } // Note: Could also be NaN
        });
      });

      var domainByKey = {};
      var labels = [];
      keys.forEach(function(key) {
        labels.push(key);
        // ... and then find the min and max of each column
        domainByKey[key] = d3.extent(data, function(d) { return d[key]; });
      });
    
      // Try to make matrix square, if possible.
      var numCells = labels.length - 1;
      var numRows = d3.round(Math.sqrt(numCells));
      var numCols = Math.ceil(numCells / numRows);

      // For plots smaller than 'minSize', don't draw axis or labels.
      var minSize = 200;
      
      // Use the number of cells to determine the initial size and spacing
      var size = Math.floor(1500 / numCols);
      var padding = size >= minSize ? 19.5 : 5;
      var spaceBetweenCells = size >= minSize ? 50 : 10;

      var xScale = d3.scale.linear()
        .range([padding / 2, size - padding / 2]);

      var yScale = d3.scale.linear()
        .range([size - padding / 2, padding / 2]);

      var xAxis = d3.svg.axis()
        .scale(xScale)
        .orient("bottom")
        .ticks(5);
      xAxis.tickSize(size);

      var yAxis = d3.svg.axis()
        .scale(yScale)
        .orient("left")
        .ticks(5);
      yAxis.tickSize(-size);

      // ======================================================================
      // Add 'Filter' button
      // TODO: Disable button when nothing is selected
      var buttons = selection.append("div");
      buttons.append("button") // TODO: Add a margin
        .text("Filter")
        .attr("class", "filterButton")
        .on("click", function() { return filter(); });

      var svg = selection.append("svg");

      // Find the maximum y-tickmark label size - will be the same for all cells
      yScale.domain(domainByKey[yLabel]);
      var yLabelWidth = 0;
      svg.selectAll("text.temp")        // Just a placeholder
        .data(yScale.ticks(5))
        .enter().append("text")
        .text(function(d) { return yScale.tickFormat()(d); })
        .each(function(d) {
          yLabelWidth = Math.max(this.getBBox().width , yLabelWidth);
        })
        .remove();
        
      // Set the size of the SVG.
      // TODO: Could this ever be too small when plots are re-sized?
      var width = (size + yLabelWidth + spaceBetweenCells) * numCells + (yLabelWidth + spaceBetweenCells);
      var height = (size + yLabelWidth + spaceBetweenCells) * numCells;
      svg.attr("width", width)
        .attr("height", height);

      // Create the plots
      var cellData = getCellData(labels);
      var cells = svg.selectAll(".cell")
        .data(cellData)
        .enter().append("g")
        .attr("class", "cell")
        .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })
        .each(plot);

      // ======================================================================

      function plot(p) {
        var cell = d3.select(this)
          .on('click', function() {
            p.selected = !p.selected;
            d3.event.stopPropagation();  // the svg click listener will not fire
            var rect = cell.select("rect")
              .style("stroke", function(d) { return p.selected ? "#FF9500" : "#aaa"; }) // #FF9500 --> "Firefox light orange"
              .style("fill", function(d) { return p.selected ? "#FF9500" : "white"; })
              .style("fill-opacity", function(d) { return p.selected ? 0.25 : 1.0; })
        });

        xScale.domain(domainByKey[p.xLabel]);
        yScale.domain(domainByKey[yLabel]);

        var rect = cell.append("rect")
          .attr("x", padding / 2)
          .attr("y", padding / 2)
          .attr("width", size - padding)
          .attr("height", size - padding)
          .style("fill", function(d) { return "white"; })
          .style("stroke", function(d) { return "#aaa"; }) // gray;

        var xGrid = cell.append("g")
          .attr("class", "x axis");
          
        var yGrid = cell.append("g")
          .attr("class", "y axis");

        if (size >= minSize) {
          xGrid.attr("x", padding / 2)
            .attr("y", padding / 2)
            .attr("width", size - padding)
            .attr("height", size - padding)
            .call(xAxis);

          yGrid.attr("x", padding / 2)
            .attr("y", padding / 2)
            .attr("width", size - padding)
            .attr("height", size - padding)
            .call(yAxis);
        }

        var circles = cell.selectAll("circle")
          .data(data.filter(function(d) {
            return !isNaN(d[yLabel]) && !isNaN(d[p.xLabel]);
          }))
          .enter().append("circle")
          .attr("cx", function(d) { return xScale(d[p.xLabel]); })
          .attr("cy", function(d) { return yScale(d[yLabel]); })
          .attr("r", size >= minSize ? 3 : 1)
          .style("fill", function(d) { return "#4682B4"; }) // steelblue
          .style("fill-opacity", function(d) { return 0.5; })
          .attr("id", function(d, i) {
            return "circle_" + i;
          });

        // x- and y- axis labels
        var xLabelText = cell.append("text")
          .attr("class", "x label");

        var yLabelText = cell.append("text")
          .attr("class", "y label");  
        
        if (size >= minSize) {
          addXAxisLabel(xLabelText, p.xLabel);
          addYAxisLabel(yLabelText, yLabel);

          circles.each (function() {
            var selectedCircle = d3.select(this);
            selectedCircle.on('click', function() {
              var isSelected = selectedCircle.attr("isSelected") == "true"; // Note: Attr is a string! (i.e. !"false" ==> false)
              selectPoints(this.id, !isSelected);
              d3.event.stopPropagation(); // the cell click listener will not fire
            });
          });

          circles.append("title")  // Tooltip
            .text(function(d) {
              return "(" + d[p.xLabel] + "," + d[yLabel] + ")";
            });
        }
        else {
          cell.append("title")  // Tooltip
            .text(p.xLabel);
        }
      }

      // ======================================================================
      function filter()
      {
        var selectedCells = [];
        cellData.forEach(function (d) {
          if (d.selected) {
            selectedCells.push(d.xLabel);
          }
        });

        numCells = selectedCells.length;
        numRows = d3.round(Math.sqrt(numCells));
        numCols = Math.ceil(numCells / numRows);

        // Use the number of cells to determine the size and spacing
        size = Math.floor(1500 /numCols)
        padding = size >= minSize ? 19.5 : 5,
        spaceBetweenCells = size >= minSize ? 50 : 10;
        
        xScale = d3.scale.linear()
          .range([padding / 2, size - padding / 2]);

        yScale = d3.scale.linear()
          .range([size - padding / 2, padding / 2]);

        xAxis = d3.svg.axis()
          .scale(xScale)
          .orient("bottom")
          .ticks(5);
        xAxis.tickSize(size);

        yAxis = d3.svg.axis()
          .scale(yScale)
          .orient("left")
          .ticks(5);
        yAxis.tickSize(-size);

        cellData = getCellData(selectedCells);

        var cells = svg.selectAll(".cell")
          .data(cellData)
          .attr("class", "cell")
          .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })

        cells.exit()
          .transition()
          .duration(500)
          .remove();

        cells.each(updatePlot);
      }

      // ======================================================================
      function updatePlot(p) {
        var cell = d3.select(this)
          .on('click', function(){
            p.selected = !p.selected;
            d3.event.stopPropagation();  // the svg click listener will not fire
            var rect = cell.select("rect")
              .style("stroke", function(d) { return p.selected ? "#FF9500" : "#aaa"; }) // #FF9500 --> "Firefox light orange"
              .style("fill", function(d) { return p.selected ? "#FF9500" : "white"; })  
              .style("fill-opacity", function(d) { return p.selected ? 0.25 : 1.0; }) 
          });

        xScale.domain(domainByKey[p.xLabel]);
        yScale.domain(domainByKey[yLabel]);

        var rect = cell.selectAll("rect")
          .attr("x", padding / 2)
          .attr("y", padding / 2)
          .attr("width", size - padding)
          .attr("height", size - padding)
          .style("fill", function(d) { return "white"; })
          .style("stroke", function(d) { return "#aaa"; }); // gray;

        var circles = cell.selectAll("circle")
          .data(data.filter(function(d) {
            return !isNaN(d[yLabel]) && !isNaN(d[p.xLabel]);
          }));

        circles.enter().append("circle");

        circles.exit()
          .transition()
          .duration(500)
          .remove();

        circles.attr("cx", function(d) { return xScale(d[p.xLabel]); })
          .attr("cy", function(d) { return yScale(d[yLabel]); })
          .attr("r", size >= minSize ? 3 : 1)
          .style("fill", function(d) { return "#4682B4"; }) // steelblue
          .style("fill-opacity", function(d) { return 0.5; })
          .attr("id", function(d, i) {
            return "circle_" + i;
          });

        circles.transition()
          .duration(500);

        if (size >= minSize) {
          cell.select(".x.axis")
            .transition()
            .duration(500)
            .attr("class", "x axis")
            .attr("x", padding / 2)
            .attr("y", padding / 2)
            .attr("width", size - padding)
            .attr("height", size - padding)
            .call(xAxis);

          cell.select(".y.axis")
            .attr("class", "y axis")
            .attr("x", padding / 2)
            .attr("y", padding / 2)
            .attr("width", size - padding)
            .attr("height", size - padding)
            .transition()
            .duration(500)
            .call(yAxis);

          // Update x- and y- axis labels
          addXAxisLabel(cell.select(".x.label"), p.xLabel);
          addYAxisLabel(cell.select(".y.label"), yLabel);

          // Tooltips
          cell.selectAll("title").remove();

          circles.each(function() {
            var selectedCircle = d3.select(this);
            selectedCircle.on('click', function() {
              var isSelected = selectedCircle.attr("isSelected") == "true"; // Note: Attr is a string! (i.e. !"false" ==> false)
              selectPoints(this.id, !isSelected);
              d3.event.stopPropagation(); // the cell click listener will not fire
            });
          });

          circles.append("title")
            .text(function(d) {
              return "(" + d[p.xLabel] + "," + d[yLabel] + ")";
            });
        }
        else {
          // Tooltip
          cell.selectAll("title")
            .text(p.xLabel);
        }
      }

      function selectPoints(id, isSelected) {
        cells.each(function(d) {
          var cell = d3.select(this);
          cell.selectAll("#" + id)
            .style("fill", function(d) { return isSelected ? "red" : "#4682B4"; })
            .style("fill-opacity", function(d) { return isSelected ? 1.0 : 0.5; })
            .attr("isSelected", isSelected);
        });
      }

      // ======================================================================

      function addXAxisLabel(xLabel, xLabelText) {
        xLabel.attr("text-anchor", "middle")
          .attr("x", (size / 2))
          .attr("y", size + padding)
          .attr("dy", "1.00em")  // Allow small gap between axis and label
          .text(xLabelText)
      }

      function addYAxisLabel(yLabel, yLabelText) {
        yLabel.attr("text-anchor", "middle")
          .attr("x", -(size / 2))
          .attr("y", -yLabelWidth)
          .attr("dy", "-0.25em")  // Allow small gap between axis and label
          .attr("transform", "rotate(-90)")
          .text(yLabelText);
      }

      // ======================================================================

      function getCellData(toPlot) {
        var data = [];
        var row = 0, col = 0;
        for (var i = 0; i < toPlot.length; ++i, ++col) {
          if (toPlot[i] == yLabel) {
            --col;  // Don't update column ...
            continue; // ... or add to grid.
          }
          else if (col >= numCols) {
            col = 0;
            ++row;
          }
          var spacing = (size >= minSize) ? yLabelWidth + spaceBetweenCells : spaceBetweenCells;
          var x = col * (size + spacing) + spacing;
          var y = row * (size + spacing);
          data.push({xLabel: toPlot[i], x: x, y: y, selected: false});
        }
        return data;
      }
    });
  }
  return matrix;
};
