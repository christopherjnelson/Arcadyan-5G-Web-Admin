import React, { useState } from "react";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import { useNavigate } from "react-router-dom";

function System() {
  const [loginToken, setLoginToken] = useState("");
  const [wifiData, setWifiData] = useState("");
  const [password, setPassword] = useState("");

  const handlePassword = (event) => {
    setPassword(event.target.value);
  };

  const handleSubmitPassword = (event) => {
    event.preventDefault();
    console.log("SUBMITTED! ", password);
    userLogin();
  };

  const navigate = useNavigate();
  const AuthHeader = {
    Authorization: "Bearer " + loginToken,
  };

  const authOptions = {
    method: "POST",
    headers: AuthHeader,
  };
  const authWifiOptions = {
    method: "GET",
    headers: AuthHeader,
  };
  const authWifiPostOptions = {
    method: "POST",
    headers: AuthHeader,
    body: wifiData,
  };

  const loginOptions = {
    method: "POST",
    headers: {
      accepts: "application/json",
      "Access-Control-Allow-Origin": "*",
    },
    body: JSON.stringify({
      username: "admin",
      password: password,
    }),
  };

  const userLogin = () => {
    console.log("user login");
    fetch("/TMI/v1/auth/login", loginOptions)
      .then((response) => response.json())
      .then((data) => {
        setLoginToken(data.auth.token);
        console.log("recieved/set token");
        alert("Success!");
      })
      .catch(function (error) {
        console.log(error);
      });
  };

  const getWifi = () => {
    if (loginToken) {
      console.log("fetching wifi data");
      fetch("/TMI/v1/network/configuration?get=ap", authWifiOptions)
        .then((response) => response.json())
        .then((data) => {
          setWifiData(JSON.stringify(data));
        })
        .catch(function (error) {
          console.log(error);
        });
    } else {
      alert("Login to Gateway first");
    }
  };

  const setWifi = () => {
    console.log("setting wifi data");
    console.log(wifiData);
    fetch("/TMI/v1/network/configuration?set=ap", authWifiPostOptions)
      .then((response) => response.json())
      .then((data) => {
        console.log(data);
      })
      .catch(function (error) {
        console.log(error);
      });
  };

  const wifiOn = () => {
    if (wifiData) {
      let onString = wifiData.replace(false, true);
      console.log(onString);
      setWifiData(onString);
      setWifi();
    } else {
      alert("Get Data First");
    }
  };

  const wifiOff = () => {
    let jsonString = JSON.stringify(wifiData);
    jsonString = jsonString.replace(true, false);
    let jsonObject = JSON.parse(jsonString);
    setWifiData(jsonObject);
    setWifi();
  };

  const restartGateway = () => {
    if (loginToken) {
      console.log("rebooting gateway");

      fetch("/TMI/v1/gateway/reset?set=reboot", authOptions)
        .then(navigate("/", { replace: true }))
        .catch(function (error) {
          console.log(error);
        });
    } else {
      alert("Login to Gateway first");
    }
  };
  return (
    <div>
      <Container>
        <Row>
          <Col>
            <h3>WiFi Radio </h3>
            <Button variant="primary">Get Data</Button>{" "}
            <Button variant="success">Radio On</Button>{" "}
            <Button variant="danger">Radio Off</Button>{" "}
          </Col>
          <Col>
            <h3>Restart Gateway </h3>
            <Button variant="warning" onClick={restartGateway}>
              Restart
            </Button>{" "}
          </Col>
        </Row>
        <Row>
          <h3>Login to Gateway</h3>
          <Form>
            <Row>
              <Col xs={7}>
                <Form.Group className="mb-1" controlId="formBasicPassword">
                  <Form.Control
                    type="password"
                    placeholder="Gateway Password"
                    value={password}
                    onChange={handlePassword}
                  />
                  <Button
                    type="submit"
                    variant="warning"
                    onClick={handleSubmitPassword}
                  >
                    Login
                  </Button>{" "}
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </Row>
      </Container>
    </div>
  );
}

export default System;
