import React, { useState, useContext, useEffect } from "react";
import {
  Card,
  Container,
  Col,
  Row,
  Button,
  Alert,
  Spinner,
} from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import { AuthContext } from "../context/AuthContext";
import WifiSettings from "./wifiSettings";
import { setWifiData } from "../modules/services";

const WifiCard = ({
  props,
  data,
  setWifiConfig,
  wifiConfig,
  isLoading,
  setIsLoading,
}) => {
  //////////////////////////
  ///////// WIFI CONFIG STATE
  //////////////////////////
  const { user } = useContext(AuthContext);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [disableDelete, setDisableDelete] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const cardIndex = Number(props);
  const ssidArray = wifiConfig.ssids;
  const newSSIDConfig = ssidArray.filter((ssid, index) => index !== cardIndex);

  const newWifiConfig = {
    ...wifiConfig,
    ssids: newSSIDConfig,
  };

  useEffect(() => {
    if (cardIndex === 0) {
      setDisableDelete(true);
    } else {
      setDisableDelete(false);
    }
  }, [wifiConfig]);

  const handleEditing = () => {
    setIsEditing(!isEditing);
  };

  const handleDeleting = () => {
    setIsDeleting(!isDeleting);

    setIsEditing(false);

    setShowDelete(!showDelete);
  };

  const handleShowPassword = (e) => {
    setShowPassword(!showPassword);
  };

  const handleCancel = () => {
    setShowDelete(!showDelete);
  };

  const handleConfirm = () => {
    setIsLoading(true);
    setWifiData(user.token, newWifiConfig)
      .then((responseData) => {
        console.log(responseData.toJSON());
      })
      .catch((error) => {
        console.log(error.toJSON());
      });
  };

  //////////////////////////
  ///////// WIFI CONFIGS/OPTIONS
  //////////////////////////

  return (
    <Card bg="dark" text="light" className="m-2 rounded shadow">
      <Card.Body>
        <Card.Title>Network {Number(props) + 1}</Card.Title>
        <Container>
          <Row>
            <Col>
              <b>SSID</b>
            </Col>
            <Col>{data.ssidName}</Col>
            <Col></Col>
          </Row>
          <Row>
            <Col>
              <b>2.4GHz Radio</b>
            </Col>
            <Col>{data["2.4ghzSsid"] ? "enabled" : "disabled"}</Col>
            <Col></Col>
          </Row>
          <Row>
            <Col>
              <b>5 GHz Radio</b>
            </Col>
            <Col>{data["5.0ghzSsid"] ? "enabled" : "disabled"}</Col>
            <Col></Col>
          </Row>
          <Row>
            <Col>
              <b>Key</b>
            </Col>
            <Col>{!showPassword ? "**********" : data.wpaKey}</Col>
            <Col>
              <FontAwesomeIcon
                icon={showPassword ? faEye : faEyeSlash}
                onClick={handleShowPassword}
              />
            </Col>
          </Row>
          <Row>
            <Col>
              <b>Encryption</b>
            </Col>
            <Col>{data.encryptionVersion + " with " + data.encryptionMode}</Col>
            <Col></Col>
          </Row>
          <Row>
            <Col>
              <b>Hidden</b>
            </Col>
            <Col>{data.isBroadcastEnabled ? "false" : "true"}</Col>
            <Col></Col>
          </Row>
          {!showDelete && (
            <>
              <Button
                variant="warning"
                className="mb-1 mt-3 me-2"
                onClick={handleEditing}
              >
                Edit
              </Button>
              {!disableDelete ? (
                <Button
                  variant="danger"
                  className="mb-1 mt-3"
                  onClick={handleDeleting}
                  disabled={disableDelete}
                >
                  Delete
                </Button>
              ) : (
                <></>
              )}
            </>
          )}
        </Container>
      </Card.Body>
      {isEditing && (
        <WifiSettings
          wifiData={data}
          props={props}
          setWifiConfig={setWifiConfig}
          wifiConfig={wifiConfig}
          isLoading={isLoading}
          setIsLoading={setIsLoading}
        />
      )}
      {showDelete && (
        <Alert variant="danger">
          <Alert.Heading>Confirm WiFi Network Deletion?</Alert.Heading>
          <p>
            This will delete this Network and all of its settings. You can not
            undo this.
          </p>
          <hr />
          <div className="d-flex justify-content-end">
            {isLoading ? (
              <Spinner animation="border" />
            ) : (
              <>
                <Button
                  variant="outline-success"
                  className="me-2"
                  onClick={handleConfirm}
                  disabled={isLoading ? true : false}
                >
                  Confirm
                </Button>
                <Button variant="outline-danger" onClick={handleCancel}>
                  Cancel
                </Button>
              </>
            )}
          </div>
        </Alert>
      )}
    </Card>
  );
};

export default WifiCard;
