var loadTimeData;
class LoadTimeData {
  constructor() {
    this.data_ = null;
  }
  set data(t) {
    expect(!this.data_, "Re-setting data."), (this.data_ = t);
  }
  valueExists(t) {
    return t in this.data_;
  }
  getValue(t) {
    expect(this.data_, "No data. Did you remember to include strings.js?");
    const e = this.data_[t];
    return expect(void 0 !== e, "Could not find value for " + t), e;
  }
  getString(t) {
    const e = this.getValue(t);
    return expectIsType(t, e, "string"), e;
  }
  getStringF(t, e) {
    const n = this.getString(t);
    if (!n) return "";
    const a = Array.prototype.slice.call(arguments);
    return (a[0] = n), this.substituteString.apply(this, a);
  }
  substituteString(t, e) {
    const n = arguments;
    return t.replace(/\$(.|$|\n)/g, function (t) {
      return (
        expect(t.match(/\$[$1-9]/), "Unescaped $ found in localized string."),
        "$$" === t ? "$" : n[t[1]]
      );
    });
  }
  getSubstitutedStringPieces(t, e) {
    const n = arguments;
    return (t.match(/(\$[1-9])|(([^$]|\$([^1-9]|$))+)/g) || []).map(
      function (t) {
        return t.match(/^\$[1-9]$/)
          ? { value: n[t[1]], arg: t }
          : (expect(
              (t.match(/\$/g) || []).length % 2 == 0,
              "Unescaped $ found in localized string.",
            ),
            { value: t.replace(/\$\$/g, "$"), arg: null });
      },
    );
  }
  getBoolean(t) {
    const e = this.getValue(t);
    return expectIsType(t, e, "boolean"), e;
  }
  getInteger(t) {
    const e = this.getValue(t);
    return (
      expectIsType(t, e, "number"),
      expect(e === Math.floor(e), "Number isn't integer: " + e),
      e
    );
  }
  overrideValues(t) {
    expect("object" == typeof t, "Replacements must be a dictionary object.");
    for (const e in t) this.data_[e] = t[e];
  }
  resetForTesting(t = null) {
    this.data_ = t;
  }
  isInitialized() {
    return null !== this.data_;
  }
}
function expect(t, e) {
  if (!t)
    throw new Error(
      "Unexpected condition on " + document.location.href + ": " + e,
    );
}
function expectIsType(t, e, n) {
  expect(typeof e === n, "[" + e + "] (" + t + ") is not a " + n);
}
expect(!loadTimeData, "should only include this file once"),
  (loadTimeData = new LoadTimeData()),
  (window.loadTimeData = loadTimeData),
  console.warn("crbug/1173575, non-JS module files deprecated.");
