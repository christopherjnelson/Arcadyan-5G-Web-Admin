import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import { Container, Spinner } from "react-bootstrap";
import { AuthContext } from "../context/AuthContext";
import WifiCard from "../components/wifiCard";
import { getWifiData, loginUser } from "../modules/services";

const WiFi = () => {
  const { user, setUser } = useContext(AuthContext);
  const [wifiConfig, setWifiConfig] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  /**
   * Get Wifi Data. Login if token expires
   */
  const getData = () => {
    setIsLoading(true);
    getWifiData(user.token)
      .then((wifiData) => {
        setWifiConfig(wifiData.data);
        setIsLoading(false);
      })
      .catch((error) => {
        console.log(error.toJSON());
        loginUser({ username: "admin", password: user.password })
          .then((loginData) => {
            let tempPassword = user.password;
            setUser({
              token: loginData.data.auth.token,
              password: tempPassword,
            });
          })
          .catch((response) => {
            console.log(response);
          });
      });
  };
  /**
   * Call Get Data on load if if user token exists. Send to login page otherwise. Refresh on changes to User State
   */
  useEffect(() => {
    if (user) {
      getData();
      const interval = setInterval(() => {
        getData();
      }, 20000);
      return () => clearInterval(interval);
    } else {
      navigate("/login", { replace: true });
    }
  }, [user]);
  /**
   * Return JSX
   */
  return (
    <Container>
      {wifiConfig ? (
        Object.keys(wifiConfig.ssids).map((key, index) => {
          return (
            <WifiCard
              key={index}
              props={key}
              data={wifiConfig.ssids[index]}
              wifiConfig={wifiConfig}
              setWifiConfig={setWifiConfig}
              isLoading={isLoading}
              setIsLoading={setIsLoading}
            />
          );
        })
      ) : (
        <Spinner animation="border" />
      )}
    </Container>
  );
};

export default WiFi;
