!(function () {
  function t(t, e, n) {
    var i = (function (t, e, n) {
      return Function.prototype.call.apply(Array.prototype.slice, arguments);
    })(arguments, 2);
    return function () {
      return e.apply(t, i);
    };
  }
  function e(t) {
    this.i = t;
  }
  function n(t) {
    t.style.display = "";
  }
  function i(t) {
    t.style.display = "none";
  }
  function r(t, e) {
    this.l.apply(this, arguments);
  }
  function s(t) {
    for (var e in t.a) delete t.a[e];
    (t.f = null), m.push(t);
  }
  function o(t, e, n) {
    try {
      return e.call(n, t.a, t.f);
    } catch (t) {
      return b.$default;
    }
  }
  function l(t) {
    if (!_[t])
      try {
        var e = "(function(a_, b_) { with (a_) with (b_) return " + t + " })",
          n = window.trustedTypes ? y.createScript(e) : e;
        _[t] = window.eval(n);
      } catch (t) {}
    return _[t];
  }
  function a(t) {
    for (var e = [], n = 0, i = (t = t.split(j)).length; i > n; ++n) {
      var r = t[n].indexOf(":");
      if (!(0 > r)) {
        var s = t[n].substr(0, r).replace(/^\s+/, "").replace(/\s+$/, "");
        (r = l(t[n].substr(r + 1))), e.push(s, r);
      }
    }
    return e;
  }
  function u() {}
  function c(t) {
    t.__jstcache ||
      (function (t, n) {
        var i = new e(n);
        for (i.h = [t]; i.h.length; ) {
          var r = i,
            s = i.h.shift();
          for (r.i(s), s = s.firstChild; s; s = s.nextSibling)
            1 == s.nodeType && r.h.push(s);
        }
      })(t, function (t) {
        h(t);
      });
  }
  function h(t) {
    if (t.__jstcache) return t.__jstcache;
    var e = t.getAttribute("jstcache");
    if (null != e) return (t.__jstcache = C[e]);
    e = T.length = 0;
    for (var n = E.length; n > e; ++e) {
      var i = E[e][0],
        r = t.getAttribute(i);
      (B[i] = r), null != r && T.push(i + "=" + r);
    }
    if (0 == T.length)
      return t.setAttribute("jstcache", "0"), (t.__jstcache = C[0]);
    var s = T.join("&");
    if ((e = A[s])) return t.setAttribute("jstcache", e), (t.__jstcache = C[e]);
    var o = {};
    for (e = 0, n = E.length; n > e; ++e) {
      i = (r = E[e])[0];
      var l = r[1];
      null != (r = B[i]) && (o[i] = l(r));
    }
    return (
      (e = "" + ++w),
      t.setAttribute("jstcache", e),
      (C[e] = o),
      (A[s] = e),
      (t.__jstcache = o)
    );
  }
  function f(t, e) {
    t.j.push(e), t.o.push(0);
  }
  function p(t) {
    return t.c.length ? t.c.pop() : [];
  }
  function d(t) {
    if (t.__jstcache) return t.__jstcache;
    var e = t.getAttribute("jstcache");
    return e ? (t.__jstcache = C[e]) : h(t);
  }
  function v(t, e) {
    var n = document;
    if (e) {
      var r = n.getElementById(t);
      if (!r) {
        r = e();
        var s = n.getElementById("jsts");
        s ||
          (((s = n.createElement("div")).id = "jsts"),
          i(s),
          (s.style.position = "absolute"),
          n.body.appendChild(s));
        var o = n.createElement("div");
        s.appendChild(o), (o.innerHTML = r), (r = n.getElementById(t));
      }
      n = r;
    } else n = n.getElementById(t);
    return n ? (c(n), (n = n.cloneNode(!0)).removeAttribute("id"), n) : null;
  }
  function g(t, e, n) {
    n == e.length - 1
      ? t.setAttribute("jsinstance", "*" + n)
      : t.setAttribute("jsinstance", "" + n);
  }
  var j = /\s*;\s*/;
  r.prototype.l = function (t, e) {
    if ((this.a || (this.a = {}), e)) {
      var n = this.a,
        i = e.a;
      for (r in i) n[r] = i[r];
    } else {
      var r = this.a;
      for (n in (i = b)) r[n] = i[n];
    }
    (this.a.$this = t),
      (this.a.$context = this),
      (this.f = void 0 !== t && null != t ? t : ""),
      e || (this.a.$top = this.f);
  };
  var y,
    b = { $default: null },
    m = [];
  (r.prototype.clone = function (t, e, n) {
    if (0 < m.length) {
      var i = m.pop();
      r.call(i, t, this), (t = i);
    } else t = new r(t, this);
    return (t.a.$index = e), (t.a.$count = n), t;
  }),
    window.trustedTypes &&
      (y = trustedTypes.createPolicy("jstemplate", {
        createScript: function (t) {
          return t;
        },
      }));
  var _ = {},
    w = 0,
    C = { 0: {} },
    A = {},
    B = {},
    T = [],
    E = [
      ["jsselect", l],
      ["jsdisplay", l],
      ["jsvalues", a],
      ["jsvars", a],
      [
        "jseval",
        function (t) {
          for (var e = [], n = 0, i = (t = t.split(j)).length; i > n; ++n)
            if (t[n]) {
              var r = l(t[n]);
              e.push(r);
            }
          return e;
        },
      ],
      [
        "transclude",
        function (t) {
          return t;
        },
      ],
      ["jscontent", l],
      ["jsskip", l],
    ];
  (u.prototype.g = function (t, e) {
    var r = d(e),
      l = r?.transclude;
    if (l)
      (r = v(l))
        ? (e.parentNode.replaceChild(r, e),
          (l = p(this)).push(this.g, t, r),
          f(this, l))
        : e.parentNode.removeChild(e);
    else if ((r = r?.jsselect)) {
      r = o(t, r, e);
      var a = e.getAttribute("jsinstance"),
        u = !1;
      a &&
        ("*" == a.charAt(0)
          ? ((a = parseInt(a.substr(1), 10)), (u = !0))
          : (a = parseInt(a, 10)));
      var c = null != r && "object" == typeof r && "number" == typeof r.length;
      l = c ? r.length : 1;
      var h = c && 0 == l;
      if (c)
        if (h)
          a
            ? e.parentNode.removeChild(e)
            : (e.setAttribute("jsinstance", "*0"), i(e));
        else if ((n(e), null === a || "" === a || (u && l - 1 > a))) {
          for (u = p(this), a = a || 0, c = l - 1; c > a; ++a) {
            var j = e.cloneNode(!0);
            e.parentNode.insertBefore(j, e),
              g(j, r, a),
              (h = t.clone(r[a], a, l)),
              u.push(this.b, h, j, s, h, null);
          }
          g(e, r, a),
            (h = t.clone(r[a], a, l)),
            u.push(this.b, h, e, s, h, null),
            f(this, u);
        } else
          l > a
            ? ((u = r[a]),
              g(e, r, a),
              (h = t.clone(u, a, l)),
              (u = p(this)).push(this.b, h, e, s, h, null),
              f(this, u))
            : e.parentNode.removeChild(e);
      else
        null == r
          ? i(e)
          : (n(e),
            (h = t.clone(r, 0, 1)),
            (u = p(this)).push(this.b, h, e, s, h, null),
            f(this, u));
    } else this.b(t, e);
  }),
    (u.prototype.b = function (t, e) {
      var r = d(e),
        s = r?.jsdisplay;
      if (s) {
        if (!o(t, s, e)) return void i(e);
        n(e);
      }
      if ((s = r?.jsvars))
        for (var l = 0, a = s.length; a > l; l += 2) {
          var u = s[l],
            c = o(t, s[l + 1], e);
          t.a[u] = c;
        }
      if ((s = r?.jsvalues))
        for (l = 0, a = s.length; a > l; l += 2)
          if (((c = s[l]), (u = o(t, s[l + 1], e)), "$" == c.charAt(0)))
            t.a[c] = u;
          else if ("." == c.charAt(0)) {
            for (
              var h = e,
                v = (c = c.substr(1).split(".")).length,
                g = 0,
                j = v - 1;
              j > g;
              ++g
            ) {
              var y = c[g];
              h[y] || (h[y] = {}), (h = h[y]);
            }
            h[c[v - 1]] = u;
          } else
            c &&
              ("boolean" == typeof u
                ? u
                  ? e.setAttribute(c, c)
                  : e.removeAttribute(c)
                : e.setAttribute(c, "" + u));
      if ((s = r?.jseval)) for (l = 0, a = s.length; a > l; ++l) o(t, s[l], e);
      if (!(s = r?.jsskip) || !o(t, s, e))
        if ((r = r?.jscontent)) {
          if (((r = "" + o(t, r, e)), e.innerHTML != r)) {
            for (; e.firstChild; ) (s = e.firstChild).parentNode.removeChild(s);
            e.appendChild(this.m.createTextNode(r));
          }
        } else {
          for (r = p(this), s = e.firstChild; s; s = s.nextSibling)
            1 == s.nodeType && r.push(this.g, t, s);
          r.length && f(this, r);
        }
    }),
    (window.jstGetTemplate = v),
    (window.JsEvalContext = r),
    (window.jstProcess = function (e, n) {
      var i = new u();
      c(n),
        (i.m = n
          ? 9 == n.nodeType
            ? n
            : n.ownerDocument || document
          : document);
      var r,
        s,
        o,
        l = t(i, i.g, e, n),
        a = (i.j = []),
        h = (i.o = []);
      for (i.c = [], l(); a.length; )
        (r = a[a.length - 1]),
          (l = h[h.length - 1]) >= r.length
            ? ((l = i), ((s = a.pop()).length = 0), l.c.push(s), h.pop())
            : ((s = r[l++]),
              (o = r[l++]),
              (r = r[l++]),
              (h[h.length - 1] = l),
              s.call(i, o, r));
    });
})();
