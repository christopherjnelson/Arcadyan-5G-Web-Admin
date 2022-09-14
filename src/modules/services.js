import axios from "axios";
/**
 * Set API Endpoints
 */
const gateWayURL = "api/gateway/?get=all";
const getWifiConfigURL = "api/network/configuration/v2?get=ap";
const setWifiConfigURL = "api/network/configuration/v2?set=ap";
const getDevicesURL = "api/network/telemetry/?get=clients";
const rebootURL = "api/gateway/reset?set=reboot";
const authURL = "api/auth/login";
const resetURL = "api/auth/admin/reset";
/**
 *
 * @returns SignalData Response
 */
export const getSignalData = async () => {
  console.log("getSignalData");
  const response = await axios({
    method: "get",
    url: gateWayURL,
    timeout: 4000,
  });
  return response;
};
/**
 *
 * @param {string} options - User Token
 * @returns WifiData Response
 */
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
/**
 *
 * @param {string} options - User Token
 * @param {string} data - New Wifi Config JSON String
 * @returns setWifiData response status
 */
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
/**
 *
 * @param {string} options - User Token
 * @returns Client Device Data
 */
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
/**
 *
 * @param {string} options - Username/Password
 * @returns loginUser response status
 */
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
/**
 *
 * @param {string} options - User Token
 * @param {string} credentials - New UserName/Password
 * @returns resetPassword response status
 */
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
/**
 *
 * @param {string} options - User Token
 * @returns rebootGateway response status
 */
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
