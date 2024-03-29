var throttle = function(e, t) {
    var a = !0,
        n = null;
    return function o() {
        var s = this;
        a ? (a = !1, setTimeout(function() {
            a = !0, n && o.apply(s)
        }, t), n ? (e.apply(this, n), n = null) : e.apply(this, arguments)) : n = arguments
    }
},
keys = document.getElementsByClassName("key"),
airKeys = [],
midline = 0,
touchKeys = [],
allKeys = [],
topKeys = airKeys,
bottomKeys = touchKeys,
compileKey = function(e) {
    var t = e.previousElementSibling,
        a = e.nextElementSibling;
    return {
        top: e.offsetTop,
        bottom: e.offsetTop + e.offsetHeight,
        left: e.offsetLeft,
        right: e.offsetLeft + e.offsetWidth,
        almostLeft: t ? e.offsetLeft + e.offsetWidth / 4 : -99999,
        almostRight: a ? e.offsetLeft + 3 * e.offsetWidth / 4 : 99999,
        kflag: parseInt(e.dataset.kflag) + (parseInt(e.dataset.air) ? 32 : 0),
        isAir: !!parseInt(e.dataset.air),
        prevKeyRef: t,
        prevKeyKflag: t ? parseInt(t.dataset.kflag) + (parseInt(t.dataset.air) ? 32 : 0) : null,
        nextKeyRef: a,
        nextKeyKflag: a ? parseInt(a.dataset.kflag) + (parseInt(a.dataset.air) ? 32 : 0) : null,
        ref: e
    }
},
isInside = function(e, t, a) {
    return a.left <= e && e < a.right && a.top <= t && t < a.bottom
},
compileKeys = function() {
    keys = document.getElementsByClassName("key"), airKeys = [], touchKeys = [];
    for (var e = 0; e < keys.length; e++) {
        var t = compileKey(keys[e]);
        t.isAir ? airKeys.push(t) : touchKeys.push(t), allKeys.push(t)
    }
    config.invert ? (topKeys = touchKeys, bottomKeys = airKeys, midline = touchKeys[0].bottom) : (topKeys = airKeys, bottomKeys = touchKeys, midline = touchKeys[0].top)
},
getKey = function(e, t) {
    if (t < midline) {
        for (var a = 0; a < topKeys.length; a++)
            if (isInside(e, t, topKeys[a])) return topKeys[a]
    } else
        for (a = 0; a < bottomKeys.length; a++)
            if (isInside(e, t, bottomKeys[a])) return bottomKeys[a];
    return null
},
lastState = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

function updateTouches(e) {
try {
    e.preventDefault();
    var t = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    throttledRequestFullscreen();

    for (var a = 0; a < e.touches.length; a++) {
        var n = e.touches[a],
        //+ windows size * 33%
            o = n.clientX -  window.innerWidth / 5,
            s = n.clientY,
            r = getKey(o, s);

        if (r) {
            setKey(t, r.kflag, r.isAir);

            if (!r.isAir) {
                if (o < r.almostLeft) {
                    setKey(t, r.prevKeyKflag, false);
                }

                if (o > r.almostRight) {
                    setKey(t, r.nextKeyKflag, false);
                }
            }
        }
    }



    for (a = 0; a < allKeys.length; a++) {
        var c = allKeys[a],
            i = c.kflag;
        if (t[i] !== lastState[i]) {
            if (t[i]) {
                c.ref.setAttribute("data-active", "");
            } else {
                c.ref.removeAttribute("data-active");
            }
        }

    }
    t !== lastState && throttledSendKeys(t), lastState = t
} catch (e) {
    alert(e)
}
}
var throttledUpdateTouches = throttle(updateTouches, 10),
setKey = function(e, t, a) {
    var n = t;
    e[n] && !a && n++, e[n] = 1
},

abovekeys = 0,


sendKeys = function(e) {
    if (abovekeys != e) {
        abovekeys = e;
        wsConnected && ws.send("b" + e.join(""))
    }

},
throttledSendKeys = throttle(sendKeys, 10),
ws = null,
wsTimeout = 0,
wsConnected = !1,
wsConnect = function() {
    (ws = new WebSocket("ws://" + location.host + "/ws")).binaryType = "arraybuffer", ws.onopen = function() {
        ws.send("alive?");
    }, ws.onmessage = function(e) {
        console.log(e.data);
        e.data.length  > 5 ? updateLed(e.data) : "alive" == e.data && (wsTimeout = 0, wsConnected = !0)
    }
},
wsWatch = function() {
    if (wsTimeout++ > 2) return wsTimeout = 0, ws.close(), wsConnected = !1, void wsConnect();
    wsConnected && ws.send("alive?")
},
canvas = document.getElementById("canvas"),
canvasCtx = canvas.getContext("2d"),
canvasData = canvasCtx.getImageData(0, 0, 33, 1),
setupLed = function() {
    for (var e = 0; e < 33; e++) canvasData.data[4 * e + 3] = 255
};
setupLed();
var updateLed = function(e) {
    var dataArr = e.split(",");  // 将接收到的字符串按逗号分割成数组
    console.log(dataArr);
    console.log(canvasData.data);
    
    

    //dataArr has 3(rgb) * 16 
    //canvasData has 4(rgba) * 32
    //so we need to convert 3(rgb) * 16 to 4(rgba) * 32 by using copy and add alpha
    for (var a = 0; a < 18; a++) { //g:0,3 r:1,4  b:2,5
        // canvasData.data[4 * a] = parseInt(dataArr[3 * (15 - a ) + 1]);
        // canvasData.data[4 * a + 1] = parseInt(dataArr[3 * (15 - a ) + 2]); //red
        // canvasData.data[4 * a + 2] = parseInt(dataArr[3 * (15 - a ) + 0]); //blue
        canvasData.data[4 * a *2] = parseInt(dataArr[3 * (15 - a ) + 1]);
        canvasData.data[4 * (a*2-1)] = parseInt(dataArr[3 * (15 - a ) + 1]);

        canvasData.data[4 * a *2 + 1] = parseInt(dataArr[3 * (15 - a ) + 2]); //red
        canvasData.data[4 * (a*2-1) + 1] = parseInt(dataArr[3 * (15 - a ) + 2]); //red

        canvasData.data[4 * a *2 + 2] = parseInt(dataArr[3 * (15 - a ) + 0]); //blue
        canvasData.data[4 * (a*2-1) + 2] = parseInt(dataArr[3 * (15 - a ) + 0]); //blue
        // canvasData.data[4 * (a+3)] = 255; //blue
    }

    

    // canvasData.data[128] = parseInt(dataArr[94]);
    // canvasData.data[129] = parseInt(dataArr[95]);
    // canvasData.data[130] = parseInt(dataArr[93]);
    canvasCtx.putImageData(canvasData, 0, 0);
};
fs = document.getElementById("fullscreen"),
requestFullscreen = function() {
    !document.fullscreenElement && screen.height <= 1024 && (fs.requestFullscreen ? fs.requestFullscreen() : fs.mozRequestFullScreen ? fs.mozRequestFullScreen() : fs.webkitRequestFullScreen && fs.webkitRequestFullScreen())
},
throttledRequestFullscreen = throttle(requestFullscreen, 3e3),
cnt = document.getElementById("main");
cnt.addEventListener("touchstart", updateTouches), cnt.addEventListener("touchmove", updateTouches), cnt.addEventListener("touchend", updateTouches);
var readConfig = function(e) {
    var t = "";
    e.invert && (t += ".container, .air-container {flex-flow: column-reverse nowrap;} ");
    var a = e.bgColor || "rbga(0, 0, 0, 0.9)";
    e.bgImage ? t += "#fullscreen {background: ".concat(a, ' url("').concat(e.bgImage, '") fixed center / cover!important; background-repeat: no-repeat;} ') : t += "#fullscreen {background: ".concat(a, ";} "), "number" == typeof e.ledOpacity && (0 === e.ledOpacity ? t += "#canvas {display: none} " : t += "#canvas {opacity: ".concat(e.ledOpacity, "} ")), "string" == typeof e.keyColor && (t += ".key[data-active] {background-color: ".concat(e.keyColor, ";} ")), "string" == typeof e.keyColor && (t += ".key.air[data-active] {background-color: ".concat(e.lkeyColor, ";} ")), "string" == typeof e.keyBorderColor && (t += ".key {border: 1px solid ".concat(e.keyBorderColor, ";} ")), e.keyColorFade && "number" == typeof e.keyColorFade && (t += ".key:not([data-active]) {transition: background ".concat(e.keyColorFade, "ms ease-out;} ")), "number" == typeof e.keyHeight && (0 === e.keyHeight ? t += ".touch-container {display: none;} " : t += ".touch-container {flex: ".concat(e.keyHeight, ";} ")), "number" == typeof e.lkeyHeight && (0 === e.lkeyHeight ? t += ".air-container {display: none;} " : t += ".air-container {flex: ".concat(e.keyHeight, ";} "));
    var n = document.createElement("style");
    n.innerHTML = t, document.head.appendChild(n)
},
initialize = function() {
    readConfig(config), compileKeys(), wsConnect(), setInterval(wsWatch, 1e3)
};
initialize(), window.onresize = compileKeys;