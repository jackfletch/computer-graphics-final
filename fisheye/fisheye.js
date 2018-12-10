(function() {
    d3.fisheye = {
      scale: function(scaleType) {
        return d3_fisheye_scale(scaleType(), 3, 0);
      },
      circular: function() {
        var radius = 200,
            distortion = 2,
            k0,
            k1,
            focus = [0, 0];
  
        function fisheye(d) {
          var dx = d.x - focus[0],
              dy = d.y - focus[1],
              dd = Math.sqrt(dx * dx + dy * dy);
          if (!dd || dd >= radius) return {x: d.x, y: d.y, z: 1};
          var k = k0 * (1 - Math.exp(-dd * k1)) / dd * .75 + .25;
          return {x: focus[0] + dx * k, y: focus[1] + dy * k, z: Math.min(k, 10)};
        }
  
        function rescale() {
          k0 = Math.exp(distortion);
          k0 = k0 / (k0 - 1) * radius;
          k1 = distortion / radius;
          return fisheye;
        }
  
        fisheye.radius = function(_) {
          if (!arguments.length) return radius;
          radius = +_;
          return rescale();
        };
  
        fisheye.distortion = function(_) {
          if (!arguments.length) return distortion;
          distortion = +_;
          return rescale();
        };
  
        fisheye.focus = function(_) {
          if (!arguments.length) return focus;
          focus = _;
          return fisheye;
        };
  
        return rescale();
      }
    };
  
    function d3_fisheye_scale(scale, d, a) {
  
      function fisheye(_) {
        var x = scale(_),
            left = x < a,
            v,
            range = d3.extent(scale.range()),
            min = range[0],
            max = range[1],
            m = left ? a - min : max - a;
        if (m == 0) m = max - min;
        return (left ? -1 : 1) * m * (d + 1) / (d + (m / Math.abs(x - a))) + a;
      }
  
      fisheye.distortion = function(_) {
        if (!arguments.length) return d;
        d = +_;
        return fisheye;
      };
  
      fisheye.focus = function(_) {
        if (!arguments.length) return a;
        a = +_;
        return fisheye;
      };
  
      fisheye.copy = function() {
        return d3_fisheye_scale(scale.copy(), d, a);
      };
  
      fisheye.nice = scale.nice;
      fisheye.ticks = scale.ticks;
      fisheye.tickFormat = scale.tickFormat;
      return d3.rebind(fisheye, scale, "domain", "range");
    }
  })();

function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

var superscript = "⁰¹²³⁴⁵⁶⁷⁸⁹";
var formatPower = function(d) { return (d + "").split("").map(function(c) { return superscript[c]; }).join(""); };
function formatTick(d) {
  var log = Math.log(d) / Math.LN10;
  if (Math.abs(Math.round(log) - log) < 1e-6) {
    return "10" + formatPower(Math.round(log));
  }
  else {
    return "";
  }
}

var coll = document.getElementsByClassName("collapsible");
var i;

for (i = 0; i < coll.length; i++) {
  coll[i].addEventListener("click", function() {
    this.classList.toggle("active");
    var content = this.nextElementSibling;
    if (content.style.maxHeight) {
      content.style.maxHeight = null;
    } else {
      content.style.maxHeight = content.scrollHeight + "px";
    }
  });
} 

(function chart1() {
  // Various accessors that specify the four dimensions of data to visualize.
  function x(d) { return d.following; }
  function y(d) { return d.followers; }
  function radius(d) { return d.tweets; }
  function color(d) { return d.movieName; }

  // Chart dimensions.
  var margin = {top: 5.5, right: 19.5, bottom: 12.5, left: 39.5},
      width = 960,
      height = 500 - margin.top - margin.bottom;

  // Various scales and distortions.
  var xScale = d3.scale.log().domain([1, 1e4]).range([0, width]),
      yScale = d3.scale.log().domain([1e1, 1e8]).range([height, 0]),
      radiusScale = d3.scale.sqrt().domain([0, 50000]).range([2, 50]),
      colorScale = d3.scale.category10().domain([
        "Creed II",
        "Avengers: Infinity War",
        "Star Wars: The Last Jedi",
        "The Hunger Games: Catching Fire",
        "Toy Story 3",
        "Shrek 2",
        "Breaking Bad",
        "Deadpool 2",
        "Dunkirk",
        "Caddyshack",
        "Furious 7"
      ]);

  var fisheye = d3.fisheye.circular()
    .distortion(3.5)
    .radius(120);

  // The x & y axes.
  var xAxis = d3.svg.axis()
    .orient("bottom")
    .scale(xScale)
    .tickFormat(d => formatTick(d))
    .tickSize(-height);
    var yAxis = d3.svg.axis()
    .orient("left")
    .scale(yScale)
    .tickFormat(d => formatTick(d))
    .tickSize(-width);

  // Create the SVG container and set the origin.
  var svg = d3.select("#chart1").append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
    .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  // Add a background rect for mousemove.
  svg.append("rect")
      .attr("class", "background")
      .attr("width", width)
      .attr("height", height);

  // Add the x-axis.
  svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis);

  // Add the y-axis.
  svg.append("g")
      .attr("class", "y axis")
      .call(yAxis);

  // Add an x-axis label.
  svg.append("text")
      .attr("class", "x label")
      .attr("text-anchor", "end")
      .attr("x", width - 6)
      .attr("y", height - 6)
      .text("accounts followed");

  // Add a y-axis label.
  svg.append("text")
      .attr("class", "y label")
      .attr("text-anchor", "end")
      .attr("x", -6)
      .attr("y", 6)
      .attr("dy", ".75em")
      .attr("transform", "rotate(-90)")
      .text("followers");

  // Load the data.
  d3.json("../../data/actorsData.json", function(actors) {

    // Add a dot per nation. Initialize the data at 1800, and set the colors.
    var dot = svg.append("g")
        .attr("class", "dots")
      .selectAll(".dot")
        .data(actors)
      .enter().append("circle")
        .attr("class", "dot")
        .style("fill", function(d) { return colorScale(color(d)); })
        .attr("x", function (d) { return d.following})
        .attr("y", function (d) { return d.followers})
        .call(position)
        .sort(function(a, b) { return radius(b) - radius(a); });

    dot.forEach(function (d) {
      d.x = d.following;
      d.y = d.followers;
    })

    // Add a title.
    function getTitle(d) {
      return `Name: ${d.name}\n` +
        `Production: ${d.movieName}\n` +
        `Followers: ${d.followers}\n` +
        `Following: ${d.following}\n` +
        `Tweets: \t${d.tweets}`;
    }

    dot.append("title")
      .text(d => getTitle(d));

    // Positions the dots based on data.
    function position(dot) {
      dot.attr("cx", function(d) { return xScale(x(d)); })
        .attr("cy", function(d) { return yScale(y(d)); })
        .attr("r", function(d) { return radiusScale(radius(d)); });
    }

    var actorPoints = svg.selectAll(".dot");

    svg.on("mousemove", function() {
      fisheye.focus(d3.mouse(this));

      actorPoints.each(function(d) {
        d.x = xScale(d.following);
        d.y = yScale(d.followers);
        d.fisheye = fisheye(d);
      })
        .attr("cx", function (d) { return d.fisheye.x; })
        .attr("cy", function (d) { return d.fisheye.y; })
        .attr("r", function (d) { return radiusScale(d.fisheye.z * radius(d)); });
    });
  });
})();

(function chart2() {
  var width = 960,
      height = 180,
      xStepsBig = d3.range(10, width, 16),
      yStepsBig = d3.range(10, height, 16),
      xStepsSmall = d3.range(0, width + 6, 6),
      yStepsSmall = d3.range(0, height + 6, 6);

  var fisheye = d3.fisheye.circular()
      .focus([360, 90])
      .radius(100);

  var line = d3.svg.line();

  var svg = d3.select("#chart2").append("svg")
      .attr("width", width)
      .attr("height", height)
    .append("g")
      .attr("transform", "translate(-.5,-.5)");

  svg.append("rect")
      .attr("class", "background")
      .attr("width", width)
      .attr("height", height);

  svg.selectAll(".x")
      .data(xStepsBig)
    .enter().append("path")
      .attr("class", "x")
      .datum(function(x) { return yStepsSmall.map(function(y) { return [x, y]; }); });

  svg.selectAll(".y")
      .data(yStepsBig)
    .enter().append("path")
      .attr("class", "y")
      .datum(function(y) { return xStepsSmall.map(function(x) { return [x, y]; }); });

  var path = svg.selectAll("path")
      .attr("d", fishline);

  svg.on("mousemove", function() {
    fisheye.focus(d3.mouse(this));
    path.attr("d", fishline);
  });

  function fishline(d) {
    return line(d.map(function(d) {
      d = fisheye({x: d[0], y: d[1]});
      return [d.x, d.y];
    }));
  }
})();

(function chart3() {
  var width = 960,
      height = 180,
      xSteps = d3.range(10, width, 16),
      ySteps = d3.range(10, height, 16);

  var xFisheye = d3.fisheye.scale(d3.scale.identity).domain([0, width]).focus(360),
      yFisheye = d3.fisheye.scale(d3.scale.identity).domain([0, height]).focus(90);

  var svg = d3.select("#chart3").append("svg")
      .attr("width", width)
      .attr("height", height)
    .append("g")
      .attr("transform", "translate(-.5,-.5)");

  svg.append("rect")
      .attr("class", "background")
      .attr("width", width)
      .attr("height", height);

  var xLine = svg.selectAll(".x")
      .data(xSteps)
    .enter().append("line")
      .attr("class", "x")
      .attr("y2", height);

  var yLine = svg.selectAll(".y")
      .data(ySteps)
    .enter().append("line")
      .attr("class", "y")
      .attr("x2", width);

  redraw();

  svg.on("mousemove", function() {
    var mouse = d3.mouse(this);
    xFisheye.focus(mouse[0]);
    yFisheye.focus(mouse[1]);
    redraw();
  });

  function redraw() {
    xLine.attr("x1", xFisheye).attr("x2", xFisheye);
    yLine.attr("y1", yFisheye).attr("y2", yFisheye);
  }
})();

(function chart4() {

  // Various accessors that specify the four dimensions of data to visualize.
  function x(d) { return d.following; }
  function y(d) { return d.followers; }
  function radius(d) { return d.tweets; }
  function color(d) { return d.movieName; }

  // Chart dimensions.
  var margin = {top: 5.5, right: 19.5, bottom: 12.5, left: 39.5},
      width = 960,
      height = 500 - margin.top - margin.bottom;

  // Various scales and distortions.
  var xScale = d3.fisheye.scale(d3.scale.log).domain([1, 1e4]).range([0, width]),
      yScale = d3.fisheye.scale(d3.scale.log).domain([1e1, 1e8]).range([height, 0]),
      radiusScale = d3.scale.sqrt().domain([0, 50000]).range([2, 40]),
      colorScale = d3.scale.category10().domain(["Creed II", "Avengers: Infinity War", 
        "Star Wars: The Last Jedi", "The Hunger Games: Catching Fire", "Toy Story 3", 
        "Shrek 2", "Breaking Bad", "Deadpool 2", "Dunkirk", "Caddyshack", "Furious 7"]);

  // The x & y axes.
  var xAxis = d3.svg.axis().orient("bottom").scale(xScale).tickSize(-height).tickFormat(d => formatTick(d)),
      yAxis = d3.svg.axis().scale(yScale).orient("left").tickSize(-width).tickFormat(d => formatTick(d));

  // Create the SVG container and set the origin.
  var svg = d3.select("#chart4").append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
    .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  // Add a background rect for mousemove.
  svg.append("rect")
      .attr("class", "background")
      .attr("width", width)
      .attr("height", height);

  // Add the x-axis.
  svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis);

  // Add the y-axis.
  svg.append("g")
      .attr("class", "y axis")
      .call(yAxis);

  // Add an x-axis label.
  svg.append("text")
      .attr("class", "x label")
      .attr("text-anchor", "end")
      .attr("x", width - 6)
      .attr("y", height - 6)
      .text("accounts followed");

  // Add a y-axis label.
  svg.append("text")
      .attr("class", "y label")
      .attr("text-anchor", "end")
      .attr("x", -6)
      .attr("y", 6)
      .attr("dy", ".75em")
      .attr("transform", "rotate(-90)")
      .text("followers");

  // Load the data.
  d3.json("../../data/actorsData.json", function(actors) {

    // Add a dot per nation. Initialize the data at 1800, and set the colors.
    var dot = svg.append("g")
        .attr("class", "dots")
      .selectAll(".dot")
        .data(actors)
      .enter().append("circle")
        .attr("class", "dot")
        .style("fill", function(d) { return colorScale(color(d)); })
        .call(position)
        .sort(function(a, b) { return radius(b) - radius(a); });

    // Add a title.
    dot.append("title")
        .text(function(d) { return "Name: " + d.name 
                                  + "\nProduction: " + d.movieName
                                  + "\nFollowers: " + numberWithCommas(d.followers) 
                                  + "\nFollowing: " + numberWithCommas(d.following)
                                  + "\nTweets: " + numberWithCommas(d.tweets); });

    // Positions the dots based on data.
    function position(dot) {
      dot .attr("cx", function(d) { return xScale(x(d)); })
          .attr("cy", function(d) { return yScale(y(d)); })
          .attr("r", function(d) { return radiusScale(radius(d)); });
    }

    svg.on("mousemove", function() {
      var mouse = d3.mouse(this);
      xScale.distortion(2.5).focus(mouse[0]);
      yScale.distortion(2.5).focus(mouse[1]);

      dot.call(position);
      svg.select(".x.axis").call(xAxis);
      svg.select(".y.axis").call(yAxis);
    });
  });
})();