/*
 Developed by Green Eagle Solutions S.L. (Spain)
 Visit us http://www.greeneaglesolutions.com

 Release Date: 2015-07-21

 For further information about CompactSCADA
 visit http://www.compactscada.com
 */

;(function (global) {
  var lit = {
    readURL: "read/items",
    readFromPatternURL: "read/patterns",
    writeURL: "write/items",
    defaultInterval: 5000,
    defaultPattern: ".*"
  };
  
  function createHttpRequest(config, callback) {
    var xhr = new global.XMLHttpRequest();
    xhr.onreadystatechange = function () {
      if (this.readyState === 4) {
        var response = this.responseText && this.responseText !== "null"
          ? global.JSON.parse(this.responseText)
          : [];
        callback(response);
      }
    };
    xhr.open(config.method, config.url, true);
    return xhr;
  }
  
  function requestJSON(config, callback) {
    var disposed = false;
    var makeRequest = function() {
      if (!disposed) {
        var xhr = createHttpRequest(config, callback);
        var sendData = typeof config.data === "object"
                        ? JSON.stringify(config.data)
                        : config.data;
        xhr.send(sendData);
        if (typeof config.interval === "number" && config.interval > 0) {
          global.setTimeout(makeRequest, config.interval);
        }
      }
    };
    makeRequest();
    return { dispose: function() { disposed = true; } };
  }
  
  function CompactScada (url) {
    this.url = url.lastIndexOf("/") === url.length - 1 ? url : url + "/";
  }
  
  CompactScada.prototype.on = function(config, callback) {
    if (callback === (void 0) && config instanceof Function) {
      callback = config;
      config = {};
    }

    var config2 = {};
    config2.interval = config.interval
      ? parseInt(config.interval)
      : lit.defaultInterval;

    if (config.itemName) {
      var itemName = config.itemName instanceof Array
                     ? config.itemName.join(",")
                     : config.itemName;
      
      config2.url = this.url + lit.readURL + "/" + itemName
      config2.method = "GET";
    }
    else {
      config2.data = [config.pattern ? config.pattern : lit.defaultPattern];
      config2.url = this.url + lit.readFromPatternURL;
      config2.method = "POST";
    }

    var disposable = requestJSON(config2, function(res) {
      if (callback) {
        var itemList = [];
        res = res instanceof Array ? res : [res];
        // Turn properties into lowercase to make them more idiomatic in JS        
        for (var i = 0; i < res.length; i++) {
          itemList[i] = {
            itemName: res[i].ItemName,
            quality: res[i].Quality,
            timestamp: new Date(parseInt(res[i].Timestamp.replace("/Date(", "").replace(")/", ""))),
            value: res[i].Value,
            writePermission: res[i].WritePermission
          };
        }
        callback(itemList);
      }
    });
    
    if (typeof config2.interval === "number" && config2.interval > 0) {
        this.activeQueries = this.activeQueries || {};
        var keys = Object.keys(this.activeQueries);
        var maxKey = keys.length === 0
          ? -1
          : keys.map(function(x) { return parseInt(x); })
                .reduce(function(prev, val) {
                  return prev > val ? prev : val;
                });
        this.activeQueries[++maxKey] = disposable;
        return maxKey;
    }
  }
  
  CompactScada.prototype.off = function(queryId) {
    if (!this.activeQueries) {
      return false;
    }
    
    if (queryId) {
      if (queryId in this.activeQueries) {
        this.activeQueries[queryId].dispose();
        delete this.activeQueries[queryId];
        return true;
      }
      else {
        return false;
      }
    }
    else {
      for (var key in this.activeQueries) {
        this.activeQueries[key].dispose();
      }
      this.activeQueries = {};
      return true;
    }
  }
  
  CompactScada.prototype.set = function(items, callback) {
    var quality = 192;
    var timestamp = "/Date(" + (new Date()).valueOf() + ")/";
    var createItem = function(kvPair) {
      var key = typeof kvPair.itemName !== "undefined" ? kvPair.itemName : kvPair.key;
      return {
        ItemName: key,
        Value: kvPair.value,
        Quality: quality,
        Timestamp: timestamp
      };
    };
  
    var data = items instanceof Array
      ? items.map(function(i) { return createItem(i) })
      : [createItem(items)];
  
    requestJSON({url: this.url + lit.writeURL, method: "POST", data: data}, function(response) {
      if (callback) {
        // Turn properties into lowercase to make them more idiomatic in JS
        callback({
          errorInfos: response.ErrorInfos.map(function (e) {
            return { errorCode: e.ErrorCode, itemName: e.ItemName };
          }),
          writtenItems: response.WrittenItems
        });
      }
    });
  }
  
  // export as Common JS module...
  if (typeof module !== "undefined" && module.exports) {
      module.exports = CompactScada;
  }
  // ... or as AMD module
  else if (typeof global.define === "function" && global.define.amd) {
      global.define(function () {
          return CompactScada;
      } );
  }
  // ... or as browser global
  else {
      global.CompactScada = CompactScada;
  }
}(window));
