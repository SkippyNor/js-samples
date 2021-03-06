/**
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var Ship = function(map, path, marker, nodeProvider) {
  this.map_ = map;
  this.path_ = path;
  this.marker_ = marker;
  this.nodeProvider_ = nodeProvider;
  this.lastNode_ = this.nodeProvider_();
  this.nextNode_ = this.nodeProvider_(this.lastNode_.index);

  this.path_.push(this.lastNode_.latLng);
  this.path_.push(this.nextNode_.latLng);

  this.speed_ = Ship.lerp(Ship.MIN_RATE, Ship.MAX_RATE, Math.random());
  this.t_ = (Math.random() * Ship.MAX_INITIAL_DISTANCE) / this.speed_;
};

Ship.MAX_INITIAL_DISTANCE = 50;
Ship.MIN_RATE = 0.025;
Ship.MAX_RATE = 0.07;

Ship.lerp = function(a, b, t) {
  return a + t * (b - a);
};

Ship.dist = function(pointA, pointB) {
  var xDist = pointA.x - pointB.x;
  var yDist = pointA.y - pointB.y;
  return Math.sqrt(xDist * xDist + yDist * yDist);
};

Ship.correctForAntimeridian = function(from, to) {
  var xDist = to.x - from.x;
  if (Math.abs(xDist + 256) < Math.abs(xDist)) {
    to.x += 256;
  } else if (Math.abs(xDist - 256) < Math.abs(xDist)) {
    to.x -= 256;
  }
};

Ship.prototype.update = function(dt) {
  this.t_ += Math.max(0, dt);
  var toTravel = this.t_ * this.speed_;

  var proj = this.map_.getProjection();
  var lastPoint = proj.fromLatLngToPoint(this.lastNode_.latLng);
  var nextPoint = proj.fromLatLngToPoint(this.nextNode_.latLng);
  Ship.correctForAntimeridian(lastPoint, nextPoint);
  var dist = Ship.dist(lastPoint, nextPoint);

  // add new legs until distance to go is less than length of next leg
  while (toTravel - dist > 0) {
    toTravel -= dist;

    // get new next point
    this.path_.setAt(this.path_.length - 1, this.nextNode_.latLng);
    this.lastNode_ = this.nextNode_;
    this.nextNode_ = this.nodeProvider_(this.lastNode_.index);
    this.path_.push(this.nextNode_);

    // update distance for next leg
    lastPoint = nextPoint;
    nextPoint = proj.fromLatLngToPoint(this.nextNode_.latLng);
    Ship.correctForAntimeridian(lastPoint, nextPoint);
    dist = Ship.dist(lastPoint, nextPoint);
  }
  this.t_ = toTravel / this.speed_;

  nextPoint.x = Ship.lerp(lastPoint.x, nextPoint.x, toTravel / dist);
  nextPoint.y = Ship.lerp(lastPoint.y, nextPoint.y, toTravel / dist);

  if (nextPoint.x < lastPoint.x) {
    this.marker_.setIcon({
      url: "pirate_marker_64_west.png",
      scaledSize: new google.maps.Size(32, 32)
    });
  } else {
    this.marker_.setIcon({
      url: "pirate_marker_64.png",
      scaledSize: new google.maps.Size(32, 32)
    });
  }

  var currentLatLng = proj.fromPointToLatLng(nextPoint);
  this.path_.setAt(this.path_.length - 1, currentLatLng);
  this.marker_.setPosition(currentLatLng);
};
