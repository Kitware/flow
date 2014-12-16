/*jslint browser: true, nomen: true */

(function (_, tangelo, $, d3) {
    'use strict';

    if (!(_ && $ && $.widget && d3)) {
        $.fn.nodelink = tangelo.unavailable({
            plugin: 'nodelink',
            required: ['Underscore', 'JQuery', 'JQuery UI', 'd3']
        });
        return;
    }

    $.widget('tangelo.spaceMap', {
        options: {
            data: [],
            constraints: [],
            linkDistance: 0,
            charge: -30,
            gravity: 0.1,
            label: tangelo.accessor({value: ''}),
            width: $(window).width(),
            height: $(window).height(),
            color: tangelo.accessor({value: '#999'}),
            size: tangelo.accessor({value: 5}),
            fixed: tangelo.accessor({value: false}),
            showPoints: true,
            showConstraints: false,
            showLinks: true,
            layout: true,
            click: null
        },

        _create: function () {
            var options,
                mapConfig,
                mapOptions,
                that = this;

            this.force = d3.layout.force();

            this.svg = d3.select(this.element.get(0)).append('svg')
                .attr('width', '100%')
                .attr('height', '100%');
            this.legends = this.svg.append('g');

            options = $.extend(true, {}, this.options);
            options.data = this.options.data;
            delete options.disabled;
            delete options.create;
            this._setOptions(options);
            this._update();
        },

        _update: function () {
            var that = this,
                dataNodes = [],
                colorScale,
                nodeEnter,
                oldNodes = this.nodes,
                i,
                constraintsOrdered,
                padding = 80,
                axis,
                xRange = [padding, that.options.width - padding],
                yRange = [that.options.height - padding, padding],
                linexConstraints,
                lineyConstraints,
                xTypes = ['x', 'ordinalx', 'xy'],
                yTypes = ['y', 'ordinaly', 'xy'],
                xConstraints = [],
                yConstraints = [];

            if (!this.svg) {
                return;
            }

            this.nodes = [];
            this.links = [];
            this.mapOpacity = 0;

            this.options.data.forEach(function (d) {
                var node = {data: d};
                that.nodes.push(node);
                dataNodes.push(node);
            });

            // Take care of spreading out linex and liney dimensions
            linexConstraints = this.options.constraints.filter(function (d) { return d.type === 'linex'; });
            lineyConstraints = this.options.constraints.filter(function (d) { return d.type === 'liney'; });
            linexConstraints.forEach(function (d, i) {
                d.yPosition = yRange[0] + (i + 1) / linexConstraints.length * (yRange[1] - yRange[0]);
            });
            lineyConstraints.forEach(function (d, i) {
                d.xPosition = xRange[0] + (i + 1) / lineyConstraints.length * (xRange[1] - xRange[0]);
            });

            // Take care of multiple x and y dimensions
            this.options.constraints.forEach(function (constraint) {
                if (!_.isNumber(constraint.strength)) {
                    constraint.strength = 1;
                }
                if (xTypes.indexOf(constraint.type) !== -1) {
                    xConstraints.push(constraint);
                }
                if (yTypes.indexOf(constraint.type) !== -1) {
                    yConstraints.push(constraint);
                }
            });
            xConstraints.forEach(function (constraint, i) {
                var span = xRange[1] - xRange[0],
                    num = xConstraints.length;
                constraint.xRange = [xRange[0] + i * span / num, xRange[0] + (i + 1) * span / num - padding];
            });
            yConstraints.forEach(function (constraint, i) {
                var span = yRange[1] - yRange[0],
                    num = yConstraints.length;
                constraint.yRange = [yRange[0] + i * span / num, yRange[0] + (i + 1) * span / num + padding];
            });

            // Now turn x,y pairs into xy
            constraintsOrdered = [];
            if (xConstraints.length > 0 && yConstraints.length > 0) {
                dataNodes.forEach(function (node) {
                    node.data._paired = {};
                });
                xConstraints.forEach(function (xConstraint, i) {
                    yConstraints.forEach(function (yConstraint, j) {
                        constraintsOrdered.push({
                            type: 'xy',
                            accessor: tangelo.accessor({field: '_paired._' + i + '_' + j}),
                            xRange: xConstraint.xRange,
                            xOrdinal: xConstraint.type === 'ordinalx',
                            yRange: yConstraint.yRange,
                            yOrdinal: yConstraint.type === 'ordinaly',
                            strength: xConstraint.strength * yConstraint.strength,
                            xConstraint: xConstraint,
                            yConstraint: yConstraint
                        });
                        dataNodes.forEach(function (node) {
                            var d = node.data;
                            d._paired['_' + i + '_' + j] = {
                                x: xConstraint.accessor(d),
                                y: yConstraint.accessor(d)
                            };
                        });
                    });
                });
                this.options.constraints.forEach(function (constraint) {
                    if (constraint.type !== 'binx' &&
                        constraint.type !== 'biny' &&
                        xTypes.indexOf(constraint.type) === -1 &&
                        yTypes.indexOf(constraint.type) === -1) {

                        constraintsOrdered.push(constraint);
                    }
                });
            } else {
                this.options.constraints.forEach(function (constraint) {
                    if (constraint.type !== 'binx' && constraint.type !== 'biny') {
                        constraintsOrdered.push(constraint);
                    }
                });
            }

            // Put binx and biny last, since they modify constraint functions
            this.options.constraints.forEach(function (constraint) {
                if (constraint.type === 'binx' || constraint.type === 'biny') {
                    constraintsOrdered.push(constraint);
                }
            });

            this.legends.selectAll('*').remove();

            function styleAxis(a) {
                a.style('shape-rendering', 'crispEdges');
                a.selectAll('line, path')
                    .style('fill', 'none')
                    .style('stroke', '#000');
            }

            constraintsOrdered.forEach(function (constraint, i) {
                var scale, xScale, yScale, ind1, ind2, distances, val1, val2;

                constraint.nodeMap = {};
                constraint.index = i;

                if (constraint.type === 'x') {
                    scale = d3.scale.linear()
                        .domain(d3.extent(that.options.data, constraint.accessor))
                        .range(constraint.xRange);
                    constraint.sizeScale = d3.scale.sqrt()
                        .domain(d3.extent(that.options.data, constraint.accessor))
                        .range([2, 20]);
                    constraint.constrain = function (d) {
                        d.x = scale(constraint.accessor(d.data));
                    };
                    axis = d3.svg.axis().orient('top').scale(scale);
                    that.legends.append('g').attr('transform', 'translate(0,20)').call(axis).call(styleAxis);
                } else if (constraint.type === 'y') {
                    scale = d3.scale.linear()
                        .domain(d3.extent(that.options.data, constraint.accessor))
                        .range(constraint.yRange);
                    constraint.sizeScale = d3.scale.sqrt()
                        .domain(d3.extent(that.options.data, constraint.accessor))
                        .range([2, 20]);
                    constraint.constrain = function (d) {
                        d.y = scale(constraint.accessor(d.data));
                    };
                    axis = d3.svg.axis().orient('left').scale(scale);
                    that.legends.append('g').attr('transform', 'translate(20,0)').call(axis).call(styleAxis);
                } else if (constraint.type === 'linex') {
                    scale = d3.scale.linear()
                        .domain(d3.extent(that.options.data, constraint.accessor))
                        .range(xRange);
                    constraint.sizeScale = d3.scale.sqrt()
                        .domain(d3.extent(that.options.data, constraint.accessor))
                        .range([2, 20]);
                    constraint.constrain = function (d) {
                        d.x = scale(constraint.accessor(d.data));
                        d.y = constraint.yPosition;
                    };
                    axis = d3.svg.axis().orient('top').scale(scale);
                    that.legends.append('g').attr('transform', 'translate(0,' + constraint.yPosition + ')').call(axis).call(styleAxis);
                } else if (constraint.type === 'liney') {
                    scale = d3.scale.linear()
                        .domain(d3.extent(that.options.data, constraint.accessor))
                        .range(yRange);
                    constraint.sizeScale = d3.scale.sqrt()
                        .domain(d3.extent(that.options.data, constraint.accessor))
                        .range([2, 20]);
                    constraint.constrain = function (d) {
                        d.x = constraint.xPosition;
                        d.y = scale(constraint.accessor(d.data));
                    };
                    axis = d3.svg.axis().orient('left').scale(scale);
                    that.legends.append('g').attr('transform', 'translate(' + constraint.xPosition + ',0)').call(axis).call(styleAxis);
                } else if (constraint.type === 'radius') {
                    scale = d3.scale.linear()
                        .domain(d3.extent(that.options.data, constraint.accessor))
                        .range([0, Math.min(that.options.height / 2 - padding, that.options.width / 2 - padding)]);
                    constraint.sizeScale = d3.scale.sqrt()
                        .domain(d3.extent(that.options.data, constraint.accessor))
                        .range([2, 20]);
                    constraint.constrain = function (d) {
                        var dx = d.x - that.options.width / 2,
                            dy = d.y - that.options.height / 2,
                            distance = Math.sqrt(dx * dx + dy * dy),
                            r = scale(constraint.accessor(d.data));
                        if (distance > 0) {
                            d.x = r * dx / distance + that.options.width / 2;
                            d.y = r * dy / distance + that.options.height / 2;
                        } else {
                            d.x = r + that.options.width / 2;
                            d.y = that.options.height / 2;
                        }
                    };
                } else if (constraint.type === 'ordinalx') {
                    scale = d3.scale.ordinal()
                        .domain(that.options.data.map(constraint.accessor))
                        .rangePoints(constraint.xRange, 1);
                    constraint.sizeScale = d3.scale.ordinal()
                        .domain(that.options.data.map(constraint.accessor))
                        .rangePoints([2, 20], 1);
                    constraint.constrain = function (d) {
                        d.x = scale(constraint.accessor(d.data));
                    };
                    axis = d3.svg.axis().orient('top').scale(scale);
                    that.legends.append('g').attr('transform', 'translate(0,20)').call(axis).call(styleAxis);
                } else if (constraint.type === 'ordinaly') {
                    scale = d3.scale.ordinal()
                        .domain(that.options.data.map(constraint.accessor))
                        .rangePoints(constraint.yRange, 1);
                    constraint.sizeScale = d3.scale.ordinal()
                        .domain(that.options.data.map(constraint.accessor))
                        .rangePoints([2, 20], 1);
                    constraint.constrain = function (d) {
                        d.y = scale(constraint.accessor(d.data));
                    };
                    axis = d3.svg.axis().orient('left').scale(scale);
                    that.legends.append('g').attr('transform', 'translate(20,0)').call(axis).call(styleAxis);
                } else if (constraint.type === 'xy') {
                    if (constraint.xOrdinal) {
                        xScale = d3.scale.ordinal()
                            .domain(that.options.data.map(function (d) {
                                return constraint.accessor(d).x;
                            }))
                            .rangePoints(constraint.xRange, 1);
                    } else {
                        xScale = d3.scale.linear()
                            .domain(d3.extent(that.options.data, function (d) {
                                return constraint.accessor(d).x;
                            }))
                            .range(constraint.xRange);
                    }
                    if (constraint.yOrdinal) {
                        yScale = d3.scale.ordinal()
                            .domain(that.options.data.map(function (d) {
                                return constraint.accessor(d).y;
                            }))
                            .rangePoints(constraint.yRange, 1);
                    } else {
                        yScale = d3.scale.linear()
                            .domain(d3.extent(that.options.data, function (d) {
                                return constraint.accessor(d).y;
                            }))
                            .range(constraint.yRange);
                    }
                    constraint.constrain = function (d) {
                        d.x = xScale(constraint.accessor(d.data).x);
                        d.y = yScale(constraint.accessor(d.data).y);
                    };
                    constraint.sizeScale = function (d) { return 4; };
                    axis = d3.svg.axis().orient('top').scale(xScale);
                    that.legends.append('g').attr('transform', 'translate(0,60)').call(axis).call(styleAxis);
                    that.legends.append('text')
                        .attr('x', (xScale.range()[xScale.range().length - 1] + xScale.range()[0]) / 2)
                        .attr('y', 20)
                        .text(constraint.xConstraint.name);
                    axis = d3.svg.axis().orient('left').scale(yScale);
                    that.legends.append('g').attr('transform', 'translate(60,0)').call(axis).call(styleAxis);
                    that.legends.append('text')
                        .attr('transform', 'translate(' + 20 + ',' + (yScale.range()[xScale.range().length - 1] + yScale.range()[0]) / 2 + ')rotate(-90)')
                        .text(constraint.yConstraint.name);
                } else if (constraint.type === 'map') {
                    that.mapOpacity = Math.max(that.mapOpacity, constraint.strength);
                    constraint.constrain = function (d) {
                        d.x = d.mapX;
                        d.y = d.mapY;
                    };
                } else if (constraint.type === 'link') {
                    constraint.constrain = function () {};
                    constraint.sizeScale = d3.scale.sqrt()
                        .domain(d3.extent(that.options.data, constraint.accessor))
                        .range([2, 20]);
                } else if (constraint.type === 'link-closest') {
                    constraint.constrain = function () {};
                    constraint.sizeScale = d3.scale.sqrt()
                        .domain(d3.extent(that.options.data, constraint.accessor))
                        .range([2, 20]);
                    distances = [];
                    for (ind1 = 0; ind1 < dataNodes.length; ind1 += 1) {
                        val1 = constraint.accessor(dataNodes[ind1].data);
                        for (ind2 = ind1 + 1; ind2 < dataNodes.length; ind2 += 1) {
                            val2 = constraint.accessor(dataNodes[ind2].data);
                            distances.push([ind1, ind2, Math.abs(val1 - val2)]);
                        }
                    }
                    distances.sort(function (a, b) { return d3.ascending(a[2], b[2]); });
                    for (ind1 = 0; ind1 < dataNodes.length; ind1 += 1) {
                        that.links.push({source: dataNodes[distances[ind1][0]], target: dataNodes[distances[ind1][1]], constraint: constraint});
                    }
                    return;
                } else if (constraint.type === 'link-bin') {
                    (function () {
                        var index = [], clusters = [], clusterSize;
                        constraint.constrain = function () {};
                        constraint.sizeScale = d3.scale.sqrt()
                            .domain(d3.extent(that.options.data, constraint.accessor))
                            .range([2, 20]);

                        dataNodes.forEach(function (d, i) {
                            index.push({index: i, value: constraint.accessor(d.data)});
                        });
                        index.sort(function (a, b) { return d3.ascending(a.value, b.value); });
                        clusterSize = Math.ceil(dataNodes.length / 10);
                        index.forEach(function (d, i) {
                            var cluster = Math.floor(i / clusterSize);
                            while (cluster >= clusters.length) {
                                clusters.push({sum: 0, count: 0});
                            }
                            clusters[cluster].sum += d.value;
                            clusters[cluster].count += 1;
                        });
                        clusters.forEach(function (d, i) {
                            var value = d.sum / d.count;
                            constraint.nodeMap[i] = {value: value, constraintNode: true, constraint: constraint};
                            that.nodes.push(constraint.nodeMap[i]);
                        });
                        index.forEach(function (d, i) {
                            var clusterNode = constraint.nodeMap[Math.floor(i / clusterSize)];
                            that.links.push({source: dataNodes[d.index], target: clusterNode, constraint: constraint});
                        });
                    }());
                    return;
                } else if (constraint.type === 'binx') {
                    scale = d3.scale.ordinal()
                        .domain(d3.set(that.options.data.map(constraint.accessor)).values())
                        .rangePoints(xRange, 1);
                    constraint.constrain = function (d) {
                        var newX = d.x;
                        newX /= scale.domain().length;
                        newX += scale(constraint.accessor(d.data)) - that.options.width / scale.domain().length / 2;
                        d.x = constraint.strength * newX + (1 - constraint.strength) * d.x;
                    };
                    that.nodes.forEach(function (d) {
                        var oldConstrain;
                        if (d.constraintNode && (d.constraint.type === 'ordinalx' || d.constraint.type === 'x' || d.constraint.type === 'xy' || d.constraint.type === 'linex' || d.constraint.type === 'liney')) {
                            oldConstrain = d.constraint.constrain;
                            d.constraint = {type: d.constraint.type, accessor: d.constraint.accessor, strength: d.constraint.strength};
                            d.constraint.constrain = function (d) {
                                oldConstrain(d);
                                constraint.constrain(d);
                            };
                        }
                    });
                    axis = d3.svg.axis().orient('top').scale(scale);
                    that.legends.append('g').attr('transform', 'translate(0,20)').call(axis).call(styleAxis);
                    return;
                } else if (constraint.type === 'biny') {
                    scale = d3.scale.ordinal()
                        .domain(d3.set(that.options.data.map(constraint.accessor)).values())
                        .rangePoints(yRange, 1);
                    constraint.constrain = function (d) {
                        var newY = d.y;
                        newY /= scale.domain().length;
                        newY += scale(constraint.accessor(d.data)) - that.options.height / scale.domain().length / 2;
                        d.y = constraint.strength * newY + (1 - constraint.strength) * d.y;
                    };
                    that.nodes.forEach(function (d) {
                        var oldConstrain;
                        if (d.constraintNode && (d.constraint.type === 'ordinaly' || d.constraint.type === 'y' || d.constraint.type === 'xy' || d.constraint.type === 'linex' || d.constraint.type === 'liney')) {
                            oldConstrain = d.constraint.constrain;
                            d.constraint = {type: d.constraint.type, accessor: d.constraint.accessor, strength: d.constraint.strength};
                            d.constraint.constrain = function (d) {
                                oldConstrain(d);
                                constraint.constrain(d);
                            };
                        }
                    });
                    axis = d3.svg.axis().orient('left').scale(scale);
                    that.legends.append('g').attr('transform', 'translate(20,0)').call(axis).call(styleAxis);
                    return;
                }
                dataNodes.forEach(function (node) {
                    var values = constraint.accessor(node.data),
                        i,
                        distances,
                        value,
                        constraintNode;
                    if (!_.isArray(values)) {
                        values = [values];
                    }
                    for (i = 0; i < values.length; i += 1) {
                        value = values[i];
                        if (!_.isString(value)) {
                            value = JSON.stringify(value);
                        }
                        if (constraint.type === 'link') {
                            if (!constraint.nodeMap[value]) {
                                constraint.nodeMap[value] = {data: node.data, value: value, constraintNode: true, constraint: constraint};
                                that.nodes.push(constraint.nodeMap[value]);
                            }
                            that.links.push({source: node, target: constraint.nodeMap[value], constraint: constraint});
                        } else {
                            constraintNode = {data: node.data, value: value, constraintNode: true, constraint: constraint};
                            that.nodes.push(constraintNode);
                            that.links.push({source: node, target: constraintNode, constraint: constraint});
                        }
                    }
                });
            });

            // Copy over x,y locations from old nodes
            if (oldNodes) {
                for (i = 0; i < this.nodes.length && i < oldNodes.length; i += 1) {
                    this.nodes[i].x = oldNodes[i].x;
                    this.nodes[i].y = oldNodes[i].y;
                }
            }

            // Set fixed flags
            this.nodes.forEach(function (d) {
                if (!d.constraintNode) {
                    d.fixed = that.options.fixed(d.data);
                }
            });

            this.force
                .linkDistance(this.options.linkDistance)
                .linkStrength(function (link) {
                    return link.constraint.strength;
                })
                .charge(this.options.charge)
                .gravity(this.options.gravity)
                .theta(0.1)
                .size([this.options.width, 0.75 * this.options.height])
                .nodes(this.nodes)
                .links(this.links)
                .start();

            this.svg.selectAll('.link').remove();
            this.svg.selectAll('.node').remove();

            this.link = this.svg.selectAll('.link')
                .data(this.links);

            colorScale = d3.scale.category10();

            this.link.enter()
                .append('line')
                .classed('link', true)
                .style('opacity', function (d) { return d.constraint.strength / 2; })
                .style('stroke', function (d) { return colorScale(d.constraint ? d.constraint.index : -1); })
                .style('stroke-width', that.options.showLinks ? 1 : 0);

            this.node = this.svg.selectAll('.node')
                .data(this.nodes);

            nodeEnter = this.node.enter()
                .append('g')
                .classed('node', true)
                .call(this.force.drag);
            nodeEnter.append('circle')
                .style('stroke', '#999')
                .style('stroke-width', 1);
            nodeEnter.append('text')
                .style('fill', 'black')
                .text(function (d) {
                    if (d.constraint) {
                        if (that.options.showConstraints === true && (
                                d.constraint.type === 'link' ||
                                d.constraint.type === 'link-bin' ||
                                d.constraint.type === 'link-all' ||
                                d.constraint.type === 'ordinalx' ||
                                d.constraint.type === 'ordinaly')) {
                            if (_.isNumber(d.value)) {
                                console.log(d3.format('.2r')(d.value));
                                return d.constraint.name + ' ' + d3.format('.2r')(d.value);
                            }
                            return d.value;
                        }
                        return '';
                    }
                    return that.options.label(d);
                });

            this.node
                .style('opacity', function (d) { return d.constraint ? d.constraint.strength : 1; })
                .on('click', function (d) {
                    if (!d.constraint) {
                        that.options.click(d.data);
                    }
                });

            this.node.selectAll('circle')
                .attr('r', function (d) { return d.constraintNode ? (that.options.showConstraints ? d.constraint.sizeScale(d.value) : 0) : (that.options.showPoints ? that.options.size(d.data) : 0); })
                .style('fill', function (d) { return d.constraint ? colorScale(d.constraint.index) : that.options.color(d.data); });

            this.force.on('tick', function () { that._tick.call(that); });
            this.force.resume();
        },

        _tick: function () {
            var that = this;

            $(this.element.get(0)).find('img').css('opacity', this.mapOpacity);

            that.nodes.forEach(function (node) {
                if (node.constraint) {
                    node.constraint.constrain(node);
                }
            });

            that.link
                // .filter(function (d) { return !that.options.fixed(d.source.data); })
                .attr('x1', function (d) { return d.source.x; })
                .attr('y1', function (d) { return d.source.y; });
            that.link
                // .filter(function (d) { return !that.options.fixed(d.target.data); })
                .attr('x2', function (d) { return d.target.x; })
                .attr('y2', function (d) { return d.target.y; });

            that.node
                // .filter(function (d) { return !that.options.fixed(d.data); })
                .attr('transform', function (d) { return 'translate(' + d.x + ',' + d.y + ')'; });
        }
    });
}(window._, window.tangelo, window.jQuery, window.d3));
