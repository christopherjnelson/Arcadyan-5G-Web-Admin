import React, { useState, useEffect, useContext } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import {
  Card,
  Row,
  Button,
  Dropdown,
  Form,
  Container,
  Col,
  Spinner,
} from "react-bootstrap";
import { AuthContext } from "../context/AuthContext";
import { setWifiData } from "../modules/services";

const WifiSettings = ({
  wifiData,
  wifiConfig,
  props,
  isLoading,
  setIsLoading,
}) => {
  //////////////////////////
  ///////// WIFI CONFIG STATE
  //////////////////////////

  const [encryption, setEncryption] = useState("");
  const [wifiSSID, setWifiSSID] = useState("");
  const [wifiKey, setWifiKey] = useState("");
  const [wifi2Radio, setWifi2Radio] = useState(false);
  const [wifi5Radio, setWifi5Radio] = useState(false);
  const [wifiBroadcast, setWifiBroadcast] = useState(false);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    setEncryption(wifiData.encryptionVersion);
    setWifiSSID(wifiData.ssidName);
    setWifiKey(wifiData.wpaKey);
    setWifi2Radio(wifiData["2.4ghzSsid"]);
    setWifi5Radio(wifiData["5.0ghzSsid"]);
    setWifiBroadcast(wifiData.isBroadcastEnabled);
  }, []);

  //////////////////////////
  ///////// WIFI CONFIGS/OPTIONS
  //////////////////////////

  const newSSIDConfig = wifiConfig.ssids.map((obj, index) => {
    if (index === Number(props)) {
      return {
        ...obj,
        "2.4ghzSsid": wifi2Radio,
        "5.0ghzSsid": wifi5Radio,
        encryptionMode: "AES",
        encryptionVersion: encryption,
        guest: false,
        isBroadcastEnabled: wifiBroadcast,
        ssidName: wifiSSID,
        wpaKey: wifiKey,
      };
    }
    return obj;
  });

  const newWifiConfig = {
    ...wifiConfig,
    ssids: newSSIDConfig,
  };

  ///////////////////
  /////// HANDLERS
  //////////////////

  const handleEncryption = (e) => {
    setEncryption(e);
  };

  const handleSSID = (e) => {
    setWifiSSID(e.target.value);
  };

  const handleKey = (e) => {
    setWifiKey(e.target.value);
  };

  const handleWifi2Radio = (e) => {
    setWifi2Radio(!wifi2Radio);
  };

  const handleWifi5Radio = (e) => {
    setWifi5Radio(!wifi5Radio);
    console.log(wifi5Radio);
  };

  const handleBroadcast = (e) => {
    setWifiBroadcast(!wifiBroadcast);
  };

  const handleSaveConfig = () => {
    setIsLoading(true);
    setWifiData(user.token, newWifiConfig)
      .then((data) => {
        console.log(data);
      })
      .catch((error) => {
        console.log(error.toJSON());
      });
  };

  return (
    <Card.Footer>
      <Container className="ms-2 me-2">
        <Row>
          <Form.Group
            as={Row}
            className="mb-3 mt-3 me-3"
            controlId="formPlaintextSSID1"
          >
            <Form.Label>SSID</Form.Label>
            <Form.Control
              required
              type="text"
              placeholder="SSID"
              defaultValue={wifiSSID}
              onChange={handleSSID}
              maxLength="28"
              isInvalid={wifiSSID.length < 1}
            />
          </Form.Group>
          <Form.Group
            as={Row}
            className="mb-3 me-3"
            controlId="formPlaintextPassword1"
          >
            <Form.Label>Password</Form.Label>
            <Form.Control
              type="password"
              placeholder="Password"
              defaultValue={wifiKey}
              onChange={handleKey}
              maxLength="63"
              isInvalid={wifiKey.length < 8}
            />
          </Form.Group>
          <Row>
            2.5GHz Radio
            {wifi2Radio ? (
              <Button
                variant="danger"
                className="mb-3"
                onClick={handleWifi2Radio}
              >
                Disable
              </Button>
            ) : (
              <Button
                variant="success"
                className="mb-3"
                onClick={handleWifi2Radio}
              >
                Enable
              </Button>
            )}
          </Row>
          <Row>
            5.0 GHz Radio
            {wifi5Radio ? (
              <Button
                variant="danger"
                className="mb-3"
                onClick={handleWifi5Radio}
              >
                Disable
              </Button>
            ) : (
              <Button
                variant="success"
                className="mb-3"
                onClick={handleWifi5Radio}
              >
                Enable
              </Button>
            )}
          </Row>
          <Row>
            Broadcast
            {wifiBroadcast ? (
              <Button
                variant="danger"
                className="mb-3"
                onClick={handleBroadcast}
              >
                Disable
              </Button>
            ) : (
              <Button
                variant="success"
                className="mb-3"
                onClick={handleBroadcast}
              >
                Enable
              </Button>
            )}
          </Row>
        </Row>

        <Dropdown className="mb-3" onSelect={handleEncryption}>
          <Dropdown.Toggle variant="warning">{encryption}</Dropdown.Toggle>

          <Dropdown.Menu>
            <Dropdown.Item eventKey="WPA2/WPA3">WPA2/WPA3</Dropdown.Item>
            <Dropdown.Item eventKey="WPA/WPA2">WPA/WPA2</Dropdown.Item>
            <Dropdown.Item eventKey="WPA2">WPA2</Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>

        {isLoading ? (
          <Button variant="warning" disabled>
            <Spinner
              as="span"
              animation="grow"
              size="sm"
              role="status"
              aria-hidden="true"
            />
            Saving...
          </Button>
        ) : (
          <Button variant="warning" onClick={handleSaveConfig}>
            Save Changes
          </Button>
        )}
      </Container>
    </Card.Footer>
  );
};

export default WifiSettings;
