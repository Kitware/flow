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
      var size = 200,
      padding = 19.5,
      spaceBetweenCells = 50;

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

      // First convert all values from strings to numbers...
      // ... and keep track of which columns to skip
      var toSkip = [];
      var keys = d3.keys(data[0]);
      data.forEach(function(d) {
        keys.forEach(function(key) {
          d[key] = +d[key]; // TODO: What about empty cells? (+"" ==> 0)
          if (isNaN(d[key]) && toSkip.indexOf(key) < 0) {
            options.toSkip.push(key);
          }
        });
      });

      var domainByKey = {};
      var labels = [];
      keys.forEach(function(key) {
        if (toSkip.indexOf(key) < 0) {
          labels.push(key);
          // ... and then find the min and max of each column
          domainByKey[key] = d3.extent(data, function(d) { return d[key]; });
        }
      });

      var svg = selection.append("svg");

      // Find the maximum y-label size - will be the same for all cells
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

      // Try to make matrix square, if possible.
      var numCells = labels.length - 1;
      var numRows = d3.round(Math.sqrt(numCells));
      var numCols = Math.ceil(numCells / numRows);

      svg.attr("width", (size + yLabelWidth + spaceBetweenCells) * numCells + (yLabelWidth + spaceBetweenCells))
        .attr("height", (size + yLabelWidth + spaceBetweenCells) * numCells)
        .append("g");

      // Create the plots
      var cellData = getCellData(labels, yLabel);
      var cells = svg.selectAll(".cell")
        .data(cellData)
        .enter().append("g")
        .attr("class", "cell")
        .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })
        .each(plot);

      function plot(p) {
        var cell = d3.select(this);

        var xLabel = p.xLabel;
        var yLabel = p.yLabel;

        xScale.domain(domainByKey[xLabel]);
        yScale.domain(domainByKey[yLabel]);

        cell.append("rect")
          .attr("class", "frame")
          .attr("x", padding / 2)
          .attr("y", padding / 2)
          .attr("width", size - padding)
          .attr("height", size - padding);

        cell.selectAll("circle")
          .data(data)
          .enter().append("circle")
          .attr("cx", function(d) { return xScale(d[xLabel]); })
          .attr("cy", function(d) { return yScale(d[yLabel]); })
          .attr("r", 3)
          .style("fill", function(d) { return "#4682B4"; }); // steelblue

        var xGrid = cell.append("g")
          .attr("class", "x axis")
          .attr("x", padding / 2)
          .attr("y", padding / 2)
          .attr("width", size - padding)
          .attr("height", size - padding)
          .call(xAxis);

        var yGrid = cell.append("g")
          .attr("class", "y axis")
          .attr("x", padding / 2)
          .attr("y", padding / 2)
          .attr("width", size - padding)
          .attr("height", size - padding)
          .call(yAxis);

        // x- and y- axis labels
        addXAxisLabel(cell.append("text"), xLabel);
        addYAxisLabel(cell.append("text"), yLabel);
      }

      function updatePlots(yLabel)
      {
        var cellData = getCellData(labels, yLabel);
        var cells = svg.selectAll(".cell")
          .data(cellData)
          .attr("class", "cell")
          .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })
          .each(updatePlot);
      }

      function updatePlot(p) {
        var cell = d3.select(this);

        var xLabel = p.xLabel;
        var yLabel = p.yLabel;

        xScale.domain(domainByKey[xLabel]);
        yScale.domain(domainByKey[yLabel]);

        cell.selectAll("circle")
          .data(data)
          .transition()
          .duration(1000)
          .attr("cx", function(d) { return xScale(d[xLabel]); })
          .attr("cy", function(d) { return yScale(d[yLabel]); })
          .attr("r", 3)
          .style("fill", function(d) { return "#4682B4"; }); // steelblue

        //Update x-axis
        cell.select(".x.axis")
          .transition()
          .duration(500)
          .call(xAxis);

        //Update y-axis
        cell.select(".y.axis")
          .transition()
          .duration(500)
          .call(yAxis);

        // Update x- and y- axis labels
        addXAxisLabel(cell.select(".x.label"), xLabel);
        addYAxisLabel(cell.select(".y.label"), yLabel);
      }

      function addXAxisLabel(xLabel, xLabelText)
      {
        xLabel.attr("class", "x label")
          .attr("text-anchor", "middle")
          .attr("x", (size / 2))
          .attr("y", size + padding)
          .attr("dy", "1.00em")  // Allow small gap between axis and label
          .text(xLabelText)
      }

      function addYAxisLabel(yLabel, yLabelText)
      {
        yLabel.attr("class", "y label")
          .attr("text-anchor", "middle")
          .attr("x", -(size / 2))
          .attr("y", -yLabelWidth)
          .attr("dy", "-0.25em")  // Allow small gap between axis and label
          .attr("transform", "rotate(-90)")
          .text(yLabelText);
      }

      function getCellData(toPlot, yLabel) {
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
          var x = col * (size + yLabelWidth + spaceBetweenCells) + (yLabelWidth + spaceBetweenCells);
          var y = row * (size + yLabelWidth + spaceBetweenCells);
          data.push({xLabel: toPlot[i], yLabel: yLabel, x: x, y: y});
        }
        return data;
      }
    });
  }
  return matrix;
};
