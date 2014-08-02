/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with tt work for additional information
 * regarding copyright ownership.  The ASF licenses tt file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use tt file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
var tt = {

    params : {
        deviceID: 2,
        eventType: 1,
        userName: "",
        password: "",
        cracha: "",
        costCenter: "",
        leave: "",
        func: "",
        sessionID: 0,
        selectedEmployee: 0,
        selectedCandidate: 0,
        selectedVacancy: 0,
        dtFmt: "d/m/Y",
        tmFmt: "H:i:s",
        shTmFmt: "H:i",
        dtTmFmt: "d/m/Y H:i:s",
        language: 0
    },

    request: null,
    response: {},
    time: {},
    thread: null,
    token: null,

    CHECK_RECORDED: 1,
    INVALID_CREDENTIALS: 2,
    OFFLINE_BACKEND: 3,

    checkInOrOut: function() {
        var payload = '';

        tt.params.userName = app.decrypt(app.username);
        tt.params.password = app.decrypt(app.password);

        for (var key in tt.params) {
            payload += key + '=' + encodeURIComponent(tt.params[key]) + '&';
        }

        payload = payload.substr(0, payload.length - 1);
        tt.params.userName = "";
        tt.params.password = "";
        //console.log("PAYLOAD: " + payload);

        tt.request = new XMLHttpRequest();
        var tt_endpoint = "https://tt.ciandt.com/.net/index.ashx/SaveTimmingEvent";

        tt.request.open("POST", tt_endpoint, false);
        tt.request.setRequestHeader("Content-type", "application/x-www-form-urlencoded");

        tt.request.onload = function(e) {
            //console.log(tt.request.responseText);
            if (tt.request.readyState != 4 || tt.request.status != 200) {
                return;
            }
            eval('tt.response = new Object(' + tt.request.responseText + ')');
        };

        tt.request.send(payload);
        //tt.mock();
        tt.processResponse();
    },

    mock: function() {
        tt.response = {
            success: true,
            msg: {
                msg: "MARCACAO EFETUADA LUCAS NASCIMENTO ARRUDA",
                type: 1
            }
        };
    },

    processResponse: function() {
        if (!tt.checkRecorded()) {
            app.forget();
            return;
        }

        tt.time.lastRecord = tt.getCurrentTime();
        app.rememberMe(app.el("remember").checked);
    },

    getGMTOffset: function() {
        var date = new Date();
        return -date.getTimezoneOffset() / 60;
    },

    syncTokenAndTime: function() {
        var tt_token_url = "https://tt.ciandt.com/.net/index.ashx/GetClockDeviceInfo?deviceID=2";
        var request = new XMLHttpRequest();

        request.open("GET", tt_token_url, true);
        request.responseType = "text";

        request.onload = function(e) {
            if (request.readyState != 4 || request.status != 200) {
                return;
            }
            eval('var response = new Object(' + request.responseText + ')');

            if (!response.hasOwnProperty('success') || response.success == false) {
                return;
            }

            tt.time.timestamp = response.deviceInfo.dtTimeEvent.getTime() / 1000;

            tt.thread = setInterval(function() {
                app.showTimer(tt.time);
                tt.time.timestamp = +tt.time.timestamp + 1;
            }, 1000);
        };

        request.send();
    },

    getCurrentTime: function() {
        var now = new Date(tt.time.timestamp * 1000);

        var d = now.getDate();
        var M = now.getMonth() + 1;
        var y = now.getFullYear();
        var h = now.getHours();
        var m = now.getMinutes();
        var s = now.getSeconds();
        // Add a zero in front of numbers < 10.
        d = (d < 10) ? "0" + d : d;
        M = (M < 10) ? "0" + M : M;
        h = (h < 10) ? "0" + h : h;
        m = (m < 10) ? "0" + m : m;
        s = (s < 10) ? "0" + s : s;

        // 04/02/2014 21:34:34
        return d + "/" + M + "/" + y + " " + h + ":" + m + ":" + s;
    },

    getReponseMessage: function() {
        if (tt.response == null || !tt.response.hasOwnProperty('success')) {
            return "Unexpected server response.\nPlease try again later.";
        }
        if (tt.response.success == true && tt.response.msg.type == tt.OFFLINE_BACKEND) {
            return "The back-end seems off-line.\nPlease try again later.";
        }
        if (tt.response.success == false && tt.response.hasOwnProperty('error')) {
            return tt.response.errorDetail;
        }
        
        return tt.response.msg.msg;
    },

    checkRecorded: function() {
        return (tt.response.hasOwnProperty('success') && 
                tt.response.success == true  &&
                tt.response.msg.type == tt.CHECK_RECORDED);
    },

    stopTimer: function() {
        clearInterval(tt.thread);
        tt.time = {};
    }
};




