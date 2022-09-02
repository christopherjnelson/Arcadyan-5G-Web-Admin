import React, { useState } from "react";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Card from "react-bootstrap/Card";
import CardGroup from "react-bootstrap/CardGroup";
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
        alert("Error");
      });
  };

  const getWifi = () => {
    if (loginToken) {
      console.log("fetching wifi data");
      fetch("/TMI/v1/network/configuration?get=ap", authWifiOptions)
        .then((response) => response.json())
        .then((data) => {
          setWifiData(data);
          alert("Succes");
        })
        .catch(function (error) {
          console.log(error);
          alert("Error");
        });
    } else {
      alert("Login to Gateway first");
    }
  };

  const setWifi = (wifiConfig) => {
    console.log("setting wifi config");
    fetch("/TMI/v1/network/configuration?set=ap", {
      method: "POST",
      headers: AuthHeader,
      body: JSON.stringify(wifiConfig),
    })
      .then((response) => {
        alert("Success");
        console.log(response);
      })
      .catch(function (error) {
        alert("Error");
        console.log(error);
      });
  };

  const wifiOn = () => {
    if (wifiData) {
      const configWifiOn = {
        ...wifiData,
        "2.4ghz": { ...wifiData["2.4ghz"], isRadioEnabled: true },
        "5.0ghz": { ...wifiData["5.0ghz"], isRadioEnabled: true },
      };
      setWifi(configWifiOn);
    } else {
      alert("Get Data First");
    }
  };

  const wifiOff = () => {
    if (wifiData) {
      console.log(wifiData);
      const configWifiOn = {
        ...wifiData,
        "2.4ghz": { ...wifiData["2.4ghz"], isRadioEnabled: false },
        "5.0ghz": { ...wifiData["5.0ghz"], isRadioEnabled: false },
      };
      console.log(configWifiOn);
      setWifi(configWifiOn);
    } else {
      alert("Get Data First");
    }
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
        <h3 className="mt-2">System</h3>
        <CardGroup>
          <Card bg="dark" text="light" className="m-2 rounded">
            <Card.Body>
              <Card.Title>Wifi Radio Toggle</Card.Title>
              <Container>
                <Button variant="primary" className="m-1" onClick={getWifi}>
                  Get Data
                </Button>
                <Button variant="success" className="m-1" onClick={wifiOn}>
                  Radio On
                </Button>
                <Button variant="danger" className="m-1" onClick={wifiOff}>
                  Radio Off
                </Button>
              </Container>
            </Card.Body>
          </Card>

          <Card bg="dark" text="light" className="m-2 rounded">
            <Card.Body>
              <Card.Title>Reboot Gateway</Card.Title>
              <Container>
                <Button variant="warning" onClick={restartGateway}>
                  Restart
                </Button>
              </Container>
            </Card.Body>
          </Card>
          <Card bg="dark" text="light" className="m-2 rounded">
            <Card.Body>
              <Card.Title>Login to Gateway</Card.Title>
              <Container>
                <Form>
                  <Row>
                    <Col>
                      <Form.Group controlId="formBasicPassword">
                        <Form.Control
                          type="password"
                          placeholder="Gateway Password"
                          value={password}
                          className="m-2"
                          onChange={handlePassword}
                        />
                        <Button
                          type="submit"
                          variant="warning"
                          className="m-2"
                          onClick={handleSubmitPassword}
                        >
                          Login
                        </Button>{" "}
                      </Form.Group>
                    </Col>
                  </Row>
                </Form>
              </Container>
            </Card.Body>
          </Card>
        </CardGroup>
      </Container>
    </div>
  );
}

export default System;
