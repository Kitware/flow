d3.chart = d3.chart || {};

/**
 * Dependency edge bundling chart for d3.js
 *
 * Usage:
 * var chart = d3.chart.dependencyedgebundling();
 * d3.select('#chart_placeholder')
 *   .datum(data)
 *   .call(chart);
 */
d3.chart.edgebundling = function(options) {

  var _diameter = 600;
  var _textRadius = 160;
  var _innerRadius;
  var _txtLinkGap = 5;
  var _minTextWidth = 7.4;
  var _radialTextHeight = 13;
  
  var link;
  var node;

  var svg;
  
  var brush;
  var handle;
  var sliderScale;

  var _data;
  var _columns;
  
  function autoDimension(data) {
    // automatically resize the dimension based on total number of nodes
    var maxLength=0;
    for (var item in data){
      var length = data[item].name.length;
      if (maxLength < length) {
        maxLength = length;
      }
    }

    var minTextRadius = Math.ceil(maxLength * _minTextWidth) + 50;  // TODO: There must be a better way to figure this out...
    if (_textRadius < minTextRadius) {
      _textRadius = minTextRadius;
    }
    var minInnerRadius = Math.ceil((_radialTextHeight * data.length)/2/Math.PI);
    if (minInnerRadius < 140) {
      minInnerRadius = 140;
    }
    var minDiameter = 2 * (_textRadius + minInnerRadius + _txtLinkGap + 2);
    if (_diameter < minDiameter) {
      _diameter = minDiameter;
    }
  }
  
  // Lazily construct the hierarchy
  var _hierarchy = function (filteredData) {
    var map = {};

    function setparent(name, data) {
      var node = map[name];
      if (!node) {
        node = map[name] = data || {name: name, children: []};
        if (name.length) {
          node.parent = map[""];
          node.parent.children.push(node);
        }
      }
    }

    setparent("", null);
    filteredData.forEach(function(d) {
      setparent(d.name, d);
    });

    return map[""];
  }
  
  // Return a list of depends for the given array of nodes.
  var getDepends = function (nodes, positive) {
    var map = {},
        depends = [];

    // Compute a map from name to node.
    nodes.forEach(function(d) {
      map[d.name] = d;
    });

    // For each dependency, construct a link from the source node(s) to target node.
    nodes.forEach(function(d) {
      if (d.dependsPos) {
        d.dependsPos.forEach(function(i) {
          var source = map[d.name]
          depends.push({source: source, target: map[i]});
        });
      }
      if (d.dependsNeg) {
        d.dependsNeg.forEach(function(i) {
          var source = map[d.name]
          depends.push({source: source, target: map[i]});
        });
      }
    });

    return depends;
  }
  
  function filterData(setpoint) {
    var filteredData = [];
    for (var i = 0; i < _data.length; i++) {
      var name = _columns[i];
      var dependsPos = [];
      var dependsNeg = [];

      for (var key in _data[i]) {
        var val = _data[i][key];
        if (key == name || isNaN(val)) {
          // do nothing
        }
        else if (val >= setpoint){ 
          dependsPos.push(key);
        }
        else if (val <= -setpoint) { 
          dependsNeg.push(key);
        }
      }
      var value = { "dependsPos" : dependsPos, "dependsNeg" : dependsNeg, "name" : name };
      filteredData.push(value);
    }
    return filteredData;
  }
  
  function mouseovered(d) {
    node.each(function(n) { n.isPositive = n.isNegative = false; });

    link
      .classed("link--positive", function(l) {
          if (l.target === d) { 
            return l.source.isPositive = d.dependsPos.indexOf(l.source.name) >= 0;
          }
        })
      .classed("link--negative", function(l) {
        if (l.target === d) {
          return l.source.isNegative = d.dependsNeg.indexOf(l.source.name) >= 0;
        }
      })
      .filter(function(l) { return l.target === d || l.source === d; })
      .each(function() { this.parentNode.appendChild(this); });

    node
      .classed("node--negative", function(n) { return n.isNegative; })
      .classed("node--positive", function(n) { return n.isPositive; });
  }

  function mouseouted(d) {
    link
      .classed("link--positive", false)
      .classed("link--negative", false);

    node
      .classed("node--negative", false)
      .classed("node--positive", false);
  }

  function line() {
    return d3.svg.line.radial()
      .interpolate("bundle")
      .tension(.95)
      .radius(function(d) { return d.y; })
      .angle(function(d) { return d.x / 180 * Math.PI; });
  }
  
  function cluster() {
    // create the layout
    return d3.layout.cluster()
      .size([360, _innerRadius])
      .sort(null)
      .value(function(d) { return d.size; });
  }

  function chart(selection) {
    selection.each(function(data) {
      _columns = data.fields;
      _data = data.rows;

      var setpoint = 0.95;
      // First convert all values from strings to numbers
      var keys = d3.keys(_data[0]);
      _data.forEach(function(d) {
        keys.forEach(function(key) {
          d[key] = +d[key]; // TODO: What about empty cells? (+"" ==> 0)
        });
      });

      var filteredData = filterData(setpoint);

      // logic to set the size of the svg graph based on input
      autoDimension(filteredData);
      var radius = _diameter / 2;
      _innerRadius = radius - _textRadius;

      // slider dimensions
      var margin = {top: 0, right: 20, bottom: 40, left: 20};
      var sliderWidth = _diameter - margin.left - margin.right;
      var sliderHeight = 100 - margin.bottom - margin.top;

      svg = selection.insert("svg")
        .attr("width", _diameter)
        .attr("height", _diameter + sliderHeight);

      var sliderGroup = svg.append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

      svg = svg.append("g")
        .attr("transform", "translate(" + radius + "," + (radius + sliderHeight) + ")");

      /////////////////////////////////////////////////////////////////////////

      // get all the link and node
      link = svg.append("g").selectAll(".link");
      node = svg.append("g").selectAll(".node");

      var hierarchy  = _hierarchy(filteredData);
      var nodes = cluster().nodes(hierarchy);
      var links = getDepends(nodes, true);

      var bundle = d3.layout.bundle();

      link = link
        .data(bundle(links))
        .enter().append("path")
        .each(function(d) { d.source = d[0], d.target = d[d.length - 1]; })
        .attr("class", "link")
        .attr("d", line());

      node = node
        .data(nodes.filter(function(n) { return !n.children; }))
        .enter().append("text")
        .attr("class", "node")
        .attr("dy", ".31em")
        .attr("transform", function(d) { return "rotate(" + (d.x - 90) + ")translate(" + (d.y + 8) + ",0)" + (d.x < 180 ? "" : "rotate(180)"); })
        .style("text-anchor", function(d) { return d.x < 180 ? "start" : "end"; })
        .text(function(d) { return d.name; })
        .on("mouseover", mouseovered)
        .on("mouseout", mouseouted);

      /////////////////////////////////////////////////////////////////////////

      sliderScale = d3.scale.linear()
        .domain([0, 1.0])
        .range([0, sliderWidth])
        .clamp(true);

      brush = d3.svg.brush()
        .x(sliderScale)
        .extent([0, 0])
        .on("brush", brushed);

      sliderGroup.append("g")
        .attr("class", "slideraxis")
        // TODO: If not offset by -10px in x, then slider will jump 10px when it's clicked
        .attr("transform", "translate(-10," + sliderHeight / 2 + ")")
        .call(d3.svg.axis()
        .scale(sliderScale)
        .orient("bottom")
        .tickFormat(function(d) { return d; })    // TODO: Format!
        .tickSize(0)
        .tickPadding(12))
        .select(".domain")
        .select(function() { return this.parentNode.appendChild(this.cloneNode(true)); })
        .attr("class", "halo");

      var slider = sliderGroup.append("g")
          .attr("class", "slider")
          .call(brush);

      slider.selectAll(".extent,.resize")
          .remove();

      slider.select(".background")
          .attr("height", sliderHeight);

      handle = slider.append("circle")
        .attr("class", "handle")
        // TODO: If not offset by -10px in x, then slider will jump 10px when it's clicked
        .attr("transform", "translate(-10," + sliderHeight / 2 + ")")
        .attr("r", 9);

      slider
        .call(brush.event)
        .transition() // gratuitous intro!
        .duration(750)
        .call(brush.extent([0.95, 0.95]))
        .call(brush.event);
    });  
  }  

  function brushed() {
    var value = brush.extent()[0];
    if (d3.event.sourceEvent) { // not a programmatic event
      value = sliderScale.invert(d3.mouse(this)[0]);
      brush.extent([value, value]);
    }
    handle.attr("cx", sliderScale(value));
    rerender(value);
  }
  
  rerender = function(setpoint) {
    var filteredData = filterData(setpoint);

    var hierarchy  = _hierarchy(filteredData);
    var nodes = cluster().nodes(hierarchy);
    var links = getDepends(nodes, true);
    
    var bundle = d3.layout.bundle();
    
    // update all the link and node
    var _link = svg.selectAll(".link")
      .data(bundle(links));
    
    // Add new links
    _link
      .enter()
      .append("path");
      
    // Remove old (unused) links  
    _link
      .exit()
      .remove();
    
    link = _link
      .each(function(d) { d.source = d[0], d.target = d[d.length - 1]; })
      .attr("class", "link")
      .attr("d", line());
      
    var _node = svg.selectAll(".node")
      .data(nodes.filter(function(n) { return !n.children; }));

    node = _node
      .attr("class", "node")
      .attr("dy", ".31em")
      .attr("transform", function(d) { return "rotate(" + (d.x - 90) + ")translate(" + (d.y + 8) + ",0)" + (d.x < 180 ? "" : "rotate(180)"); })
      .style("text-anchor", function(d) { return d.x < 180 ? "start" : "end"; })
      .text(function(d) { return d.name; })
      .on("mouseover", mouseovered)
      .on("mouseout", mouseouted);
  }

  return chart;
};




