import axios from "axios";
//////////////////
//// Set API Endpoints
//////////////////

const gateWayURL = "api/gateway/?get=all";
const getWifiConfigURL = "api/network/configuration/v2?get=ap";
const setWifiConfigURL = "api/network/configuration/v2?set=ap";
const getDevicesURL = "api/network/telemetry/?get=clients";
const rebootURL = "api/gateway/reset?set=reboot";
const authURL = "api/auth/login";
const resetURL = "api/auth/admin/reset";
//////////////////
//// Get Cell Signal Data
//////////////////
export const getSignalData = async () => {
  console.log("getSignalData");
  const response = await axios({
    method: "get",
    url: gateWayURL,
    timeout: 4000,
  });
  return response;
};
//////////////////
//// Get Wifi Data
//////////////////
export const getWifiData = async (options) => {
  console.log("getWifiData");
  const response = await axios({
    method: "get",
    url: getWifiConfigURL,
    timeout: 4000,
    headers: {
      Authorization: "Bearer " + options,
    },
  });
  if (response.status === 200) {
    return response;
  }
  return await Promise.reject(response);
};
//////////////////
//// Set Wifi Data
//////////////////
export const setWifiData = async (options, data) => {
  console.log("setWifiData");
  console.log(options);
  console.log(data);
  const response = await axios({
    method: "post",
    url: setWifiConfigURL,
    timeout: 4000,
    headers: {
      Authorization: "Bearer " + options,
    },
    data: data,
  });
  if (response.status === 200) {
    return response;
  }
  return Promise.reject(response);
};
//////////////////
//// Get Connected Devices to Gateway
//////////////////
export const getDeviceData = async (options) => {
  console.log("getDeviceData");
  const response = await axios({
    method: "get",
    url: getDevicesURL,
    timeout: 4000,
    headers: {
      Authorization: "Bearer " + options,
    },
  });
  if (response.status === 200) {
    return response;
  }
  return Promise.reject(response);
};
//////////////////
//// Login User
//////////////////
export const loginUser = async (options) => {
  console.log("loginUser");
  const response = await axios({
    method: "post",
    url: authURL,
    timeout: 4000,
    data: options,
  });

  if (response.status === 200) {
    return response;
  }
  return Promise.reject(response);
};
//////////////////
//// Reset Admin Gateway Password
//////////////////
export const resetPassword = async (options, credentials) => {
  console.log("resetPassword");
  console.log(credentials);
  const response = await axios({
    method: "post",
    url: resetURL,
    timeout: 4000,
    headers: {
      Authorization: "Bearer " + options,
    },
    data: credentials,
  });

  if (response.status === 200) {
    return response;
  }
  return Promise.reject(response);
};
//////////////////
//// Reboot Gateway
//////////////////
export const rebootGateway = async (options) => {
  console.log("reboot gateway");
  const response = await axios({
    method: "post",
    url: rebootURL,
    timeout: 4000,
    headers: {
      Authorization: "Bearer " + options,
    },
  });
  return response;
};
