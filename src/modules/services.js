import axios from "axios";
//////////////////
//// Set API Endpoints
//////////////////
const apiEndPoint = "/TMI/v1/";
const gateWayURL = "gateway/?get=all";
const getWifiConfigURL = "network/configuration/v2?get=ap";
const setWifiConfigURL = "network/configuration/v2?set=ap";
const getDevicesURL = "network/telemetry/?get=clients";
const rebootURL = "gateway/reset?set=reboot";
const authURL = "auth/login";
const resetURL = "auth/admin/reset";
//////////////////
//// Get Cell Signal Data
//////////////////
export const getSignalData = async () => {
  console.log("getSignalData");
  const response = await axios({
    url: apiEndPoint + gateWayURL,
    method: "get",
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
    url: apiEndPoint + getWifiConfigURL,
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
    url: apiEndPoint + setWifiConfigURL,
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
    url: apiEndPoint + getDevicesURL,
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
    url: apiEndPoint + authURL,
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
    url: apiEndPoint + resetURL,
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
    url: apiEndPoint + rebootURL,
    timeout: 4000,
    headers: {
      Authorization: "Bearer " + options,
    },
  });
  return response;
};
