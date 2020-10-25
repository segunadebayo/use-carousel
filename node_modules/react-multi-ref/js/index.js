"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var MultiRef =
/*#__PURE__*/
function () {
  function MultiRef() {
    (0, _classCallCheck2.default)(this, MultiRef);
    (0, _defineProperty2.default)(this, "map", new Map());
    (0, _defineProperty2.default)(this, "_refFns", new Map());
  }

  (0, _createClass2.default)(MultiRef, [{
    key: "ref",
    value: function ref(key) {
      var _this = this;

      var refFn = this._refFns.get(key);

      if (!refFn) {
        refFn = function refFn(value) {
          if (value == null) {
            _this._refFns.delete(key);

            _this.map.delete(key);
          } else {
            _this.map.set(key, value);
          }
        };

        this._refFns.set(key, refFn);
      }

      return refFn;
    }
  }]);
  return MultiRef;
}();

exports.default = MultiRef;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9pbmRleC5qcyJdLCJuYW1lcyI6WyJNdWx0aVJlZiIsIk1hcCIsImtleSIsInJlZkZuIiwiX3JlZkZucyIsImdldCIsInZhbHVlIiwiZGVsZXRlIiwibWFwIiwic2V0Il0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7SUFJcUJBLFE7Ozs7OytDQUNILElBQUlDLEdBQUosRTttREFFVyxJQUFJQSxHQUFKLEU7Ozs7O3dCQUV2QkMsRyxFQUFrQjtBQUFBOztBQUNwQixVQUFJQyxLQUFnQixHQUFHLEtBQUtDLE9BQUwsQ0FBYUMsR0FBYixDQUFpQkgsR0FBakIsQ0FBdkI7O0FBQ0EsVUFBSSxDQUFDQyxLQUFMLEVBQVk7QUFDVkEsUUFBQUEsS0FBSyxHQUFHLGVBQUFHLEtBQUssRUFBSTtBQUNmLGNBQUlBLEtBQUssSUFBSSxJQUFiLEVBQW1CO0FBQ2pCLFlBQUEsS0FBSSxDQUFDRixPQUFMLENBQWFHLE1BQWIsQ0FBb0JMLEdBQXBCOztBQUNBLFlBQUEsS0FBSSxDQUFDTSxHQUFMLENBQVNELE1BQVQsQ0FBZ0JMLEdBQWhCO0FBQ0QsV0FIRCxNQUdPO0FBQ0wsWUFBQSxLQUFJLENBQUNNLEdBQUwsQ0FBU0MsR0FBVCxDQUFhUCxHQUFiLEVBQWtCSSxLQUFsQjtBQUNEO0FBQ0YsU0FQRDs7QUFRQSxhQUFLRixPQUFMLENBQWFLLEdBQWIsQ0FBaUJQLEdBQWpCLEVBQXNCQyxLQUF0QjtBQUNEOztBQUNELGFBQU9BLEtBQVA7QUFDRCIsInNvdXJjZXNDb250ZW50IjpbIi8qIEBmbG93ICovXG5cbnR5cGUgUmVmRm48Vj4gPSAodmFsdWU6IFZ8bnVsbCkgPT4gbWl4ZWQ7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIE11bHRpUmVmPEssVj4ge1xuICBtYXA6IE1hcDxLLFY+ID0gbmV3IE1hcCgpO1xuXG4gIF9yZWZGbnM6IE1hcDxLLFJlZkZuPFY+PiA9IG5ldyBNYXAoKTtcblxuICByZWYoa2V5OiBLKTogUmVmRm48Vj4ge1xuICAgIGxldCByZWZGbjogP1JlZkZuPFY+ID0gdGhpcy5fcmVmRm5zLmdldChrZXkpO1xuICAgIGlmICghcmVmRm4pIHtcbiAgICAgIHJlZkZuID0gdmFsdWUgPT4ge1xuICAgICAgICBpZiAodmFsdWUgPT0gbnVsbCkge1xuICAgICAgICAgIHRoaXMuX3JlZkZucy5kZWxldGUoa2V5KTtcbiAgICAgICAgICB0aGlzLm1hcC5kZWxldGUoa2V5KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aGlzLm1hcC5zZXQoa2V5LCB2YWx1ZSk7XG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgICB0aGlzLl9yZWZGbnMuc2V0KGtleSwgcmVmRm4pO1xuICAgIH1cbiAgICByZXR1cm4gcmVmRm47XG4gIH1cbn1cbiJdfQ==