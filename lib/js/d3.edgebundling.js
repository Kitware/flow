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

  var _radius;
  var _diameter = 600;
  var _textRadius = 160;
  var _innerRadius;
  var _txtLinkGap = 5;
  var _minTextWidth = 7.4;
  var _radialTextHeight = 13;
  
  var link;
  var node;

  var svg;
  
  function resetDimension() {
    _radius = _diameter / 2;
    _innerRadius = _radius - _textRadius;
  }
  
  function autoDimension(data) {
    // automatically resize the dimension based on total number of nodes
    var item=0, maxLength=0, length=0, maxItem;
    for (item in data){
      length = data[item].name.length;
      if (maxLength < length) {
        maxLength = length;
        maxItem = data[item].name;
      }
    }

    var minTextRadius = Math.ceil(maxLength * _minTextWidth);
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
  
  // Lazily construct the package hierarchy
   var _packageHierarchy = function (filteredData) {
    var map = {};

    function setparent(name, data) {
      var node = map[name];
      if (!node) {
        node = map[name] = data || {name: name, children: []};
        if (name.length) {
          node.parent = map[""];
          node.parent.children.push(node);
          node.key = name;
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
  var packageDepends = function (nodes, positive) {
    var map = {},
        depends = [];

    // Compute a map from name to node.
    nodes.forEach(function(d) {
      map[d.name] = d;
    });

    // For each dependency, construct a link from the source to target node.
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
  
  function filterData(data, columns, setpoint) {
    var filteredData = [];
    for (var i = 0; i < data.length; i++) {
      var name = columns[i];
      var dependsPos = [];
      var dependsNeg = [];

      for (var key in data[i]) {
        var val = data[i][key];

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
    node.each(function(n) { n.target = n.source = false; });

    link
      .classed("link--target", function(l) {
          if (l.target === d) { 
            var is_pos = d.dependsPos.indexOf(l.source.key) >= 0;
            return l.source.target = true && is_pos; 
          }
        })
      .classed("link--source", function(l) {
        if (l.target === d) {
          var is_neg = d.dependsNeg.indexOf(l.source.key) >= 0;
          return l.source.source = true && is_neg; 
        }
      })
      .filter(function(l) { return l.target === d || l.source === d; })
      .each(function() { this.parentNode.appendChild(this); });

    node
      .classed("node--target", function(n) { return n.source; })
      .classed("node--source", function(n) { return n.target; });
  }

  function mouseouted(d) {
    link
      .classed("link--target", false)
      .classed("link--source", false);

    node
      .classed("node--target", false)
      .classed("node--source", false);
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
      var columns = data.fields;
      var data = data.rows;
      var setpoint = 0.95;

      // First convert all values from strings to numbers
      var keys = d3.keys(data[0]);
      data.forEach(function(d) {
        keys.forEach(function(key) {
          d[key] = +d[key]; // TODO: What about empty cells? (+"" ==> 0)
        });
      });
      var filteredData = filterData(data, columns, setpoint);
      
      // logic to set the size of the svg graph based on input
      autoDimension(filteredData);
      resetDimension();

      svg = selection.insert("svg")
        .attr("width", _diameter)
        .attr("height", _diameter)
        .append("g")
        .attr("transform", "translate(" + _radius + "," + _radius + ")");

      // get all the link and node
      link = svg.append("g").selectAll(".link");
      node = svg.append("g").selectAll(".node");
      
      var pkgNodes  = _packageHierarchy(filteredData);
      var nodes = cluster().nodes(pkgNodes),
          links = packageDepends(nodes, true);
      
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
        .text(function(d) { return d.key; })
        .on("mouseover", mouseovered)
        .on("mouseout", mouseouted);
    });  
  }  
  
  rerender = function(data, setpoint) {
    var columns = data.fields;
    var data = data.rows;
    // First convert all values from strings to numbers
    var keys = d3.keys(data[0]);
    data.forEach(function(d) {
        keys.forEach(function(key) {
            d[key] = +d[key]; // TODO: What about empty cells? (+"" ==> 0)
        });
    });
    var filteredData = filterData(data, columns, setpoint);

    var pkgNodes  = _packageHierarchy(filteredData);
    var nodes = cluster().nodes(pkgNodes),
          links = packageDepends(nodes, true);
    
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
    
    /*_node
      .enter()
      .append("text");
      
    _node
      .exit()
      .remove();
    */
    
    node = _node
      .attr("class", "node")
      .attr("dy", ".31em")
      .attr("transform", function(d) { return "rotate(" + (d.x - 90) + ")translate(" + (d.y + 8) + ",0)" + (d.x < 180 ? "" : "rotate(180)"); })
      .style("text-anchor", function(d) { return d.x < 180 ? "start" : "end"; })
      .text(function(d) { return d.key; })
      .on("mouseover", mouseovered)
      .on("mouseout", mouseouted);
  }
  
  chart.packageHierarchy = function (p) {
    if (!arguments.length) return p;
    _packageHierarchy = p;
    return chart;
  };

  chart.diameter = function (d) {
    if (!arguments.length) return d;
    _diameter = d;
    return chart;
  };

  chart.textRadius = function (t) {
    if (!arguments.length) return t;
    _textRadius = t;
    return chart;
  };

  chart.txtLinkGap = function (t) {
    if (!arguments.length) return t;
    _txtLinkGap = t;
    return chart;
  };

  chart.txtWidth = function (t) {
    if (!arguments.length) return t;
    _minTextWidth = t;
    return chart;
  };

  chart.nodeWidth = function (n) {
    if (!arguments.length) return n;
    _radialTextHeight = n;
    return chart;
  };
 
  return chart;
};




