import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardGroup,
  Row,
  Col,
  Container,
  Spinner,
  ProgressBar,
  OverlayTrigger,
} from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleInfo } from "@fortawesome/free-solid-svg-icons";
import { AuthContext } from "../context/AuthContext";
import { getSignalData } from "../modules/services";
import {
  band4Pop,
  band5Pop,
  rsrpPop,
  rsrqPop,
  sinrPop,
} from "../modules/popovers";

const Signal = () => {
  const [cellData, setCellData] = useState();
  const { user } = useContext(AuthContext);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const getData = () => {
    getSignalData()
      .then((signalData) => {
        setCellData(signalData.data);
        setIsLoading(false);
      })
      .catch((error) => {
        console.log(error);
      });
  };

  useEffect(() => {
    setIsLoading(true);
    if (user !== null) {
      getData();
      const interval = setInterval(() => {
        getData();
      }, 5000);
      return () => clearInterval(interval);
    } else {
      navigate("/login", { replace: true });
    }
  }, [navigate, user]);

  const signalSwitch = (rating) =>
    ({
      null: "Offline",
      0: "Offline",
      1: "Poor",
      2: "Fair",
      3: "Good",
      4: "Very Good",
      5: "Excellent",
    }[rating]);

  const signalColorSwitch = (rating) =>
    ({
      null: "danger",
      0: "danger",
      1: "danger",
      2: "warning",
      3: "success",
      4: "success",
      5: "info",
    }[rating]);

  return (
    <div className="App">
      <Container>
        <CardGroup>
          <Card bg="dark" text="light" className="m-2 rounded shadow">
            <Card.Body>
              <Card.Title>Gateway</Card.Title>
              {!isLoading ? (
                <Container>
                  <Row className="mb-1">
                    <Col>
                      <b>HWVersion</b>
                    </Col>
                    <Col>{cellData?.device.hardwareVersion}</Col>
                  </Row>
                  <Row className="mb-1">
                    <Col>
                      <b>MAC</b>
                    </Col>
                    <Col>{cellData?.device.macId}</Col>
                  </Row>
                  <Row className="mb-1">
                    <Col>
                      <b>Manufacturer</b>
                    </Col>
                    <Col>{cellData?.device.manufacturer}</Col>
                  </Row>
                  <Row className="mb-1">
                    <Col>
                      <b>Model</b>
                    </Col>
                    <Col>{cellData?.device.model}</Col>
                  </Row>
                  <Row className="mb-1">
                    <Col>
                      <b>SN</b>
                    </Col>
                    <Col>{cellData?.device.serial}</Col>
                  </Row>
                  <Row className="mb-1">
                    <Col>
                      <b>Firmware</b>
                    </Col>
                    <Col>{cellData?.device.softwareVersion}</Col>
                  </Row>
                </Container>
              ) : (
                <Spinner animation="border" />
              )}
            </Card.Body>
          </Card>
          <Card bg="dark" text="light" className="m-2 rounded shadow">
            <Card.Body>
              <Card.Title>LTE</Card.Title>
              {!isLoading ? (
                <Container>
                  <Row>
                    <Col>
                      <b>Signal</b>
                    </Col>
                    <Col>
                      <ProgressBar
                        variant={signalColorSwitch(
                          cellData?.signal["4g"]?.bars
                        )}
                        now={cellData?.signal["4g"]?.bars * 20}
                        label={signalSwitch(cellData?.signal["4g"]?.bars)}
                      />
                    </Col>
                    <Col></Col>
                  </Row>
                  <Row className="mb-1">
                    <Col>
                      <b>Band</b>
                    </Col>
                    <Col>{cellData?.signal["4g"].bands}</Col>
                    <Col>
                      <OverlayTrigger
                        trigger="click"
                        placement="right"
                        overlay={band4Pop}
                      >
                        <FontAwesomeIcon icon={faCircleInfo} />
                      </OverlayTrigger>
                    </Col>
                  </Row>

                  <Row className="mb-1">
                    <Col>
                      <b>RSRP</b>
                    </Col>
                    <Col>{cellData?.signal["4g"].rsrp} dBm</Col>
                    <Col>
                      <OverlayTrigger
                        trigger="click"
                        placement="right"
                        overlay={rsrpPop}
                      >
                        <FontAwesomeIcon icon={faCircleInfo} />
                      </OverlayTrigger>
                    </Col>
                  </Row>
                  <Row className="mb-1">
                    <Col>
                      <b>RSRQ</b>
                    </Col>
                    <Col>{cellData?.signal["4g"].rsrq} dB</Col>
                    <Col>
                      <OverlayTrigger
                        trigger="click"
                        placement="right"
                        overlay={rsrqPop}
                      >
                        <FontAwesomeIcon icon={faCircleInfo} />
                      </OverlayTrigger>
                    </Col>
                  </Row>
                  <Row className="mb-1">
                    <Col>
                      <b>SINR</b>
                    </Col>
                    <Col>{cellData?.signal["4g"].sinr} dB</Col>
                    <Col>
                      <OverlayTrigger
                        trigger="click"
                        placement="right"
                        overlay={sinrPop}
                      >
                        <FontAwesomeIcon icon={faCircleInfo} />
                      </OverlayTrigger>
                    </Col>
                  </Row>
                </Container>
              ) : (
                <Spinner animation="border" />
              )}
            </Card.Body>
          </Card>
          <Card bg="dark" text="light" className="m-2 rounded shadow">
            <Card.Body>
              <Card.Title>5G</Card.Title>
              {!isLoading ? (
                <Container>
                  <Row className="mb-1">
                    <Col>
                      <b>Signal</b>
                    </Col>
                    <Col>
                      <ProgressBar
                        variant={signalColorSwitch(
                          cellData?.signal?.["5g"]?.bars
                        )}
                        now={cellData?.signal?.["5g"]?.bars * 20}
                        label={signalSwitch(cellData?.signal?.["5g"]?.bars)}
                      />
                    </Col>
                    <Col></Col>
                  </Row>
                  <Row className="mb-1">
                    <Col>
                      <b>Band</b>
                    </Col>
                    <Col>{cellData?.signal?.["5g"].bands}</Col>
                    <Col>
                      <OverlayTrigger
                        trigger="click"
                        placement="right"
                        overlay={band5Pop}
                      >
                        <FontAwesomeIcon icon={faCircleInfo} />
                      </OverlayTrigger>
                    </Col>
                  </Row>
                  <Row className="mb-1">
                    <Col>
                      <b>RSRP</b>
                    </Col>
                    <Col>{cellData?.signal?.["5g"].rsrp} dBm</Col>
                    <Col>
                      <OverlayTrigger
                        trigger="click"
                        placement="right"
                        overlay={rsrpPop}
                      >
                        <FontAwesomeIcon icon={faCircleInfo} />
                      </OverlayTrigger>
                    </Col>
                  </Row>
                  <Row className="mb-1">
                    <Col>
                      <b>RSRQ</b>
                    </Col>
                    <Col>{cellData?.signal?.["5g"].rsrq} dB</Col>
                    <Col>
                      <OverlayTrigger
                        trigger="click"
                        placement="right"
                        overlay={rsrqPop}
                      >
                        <FontAwesomeIcon icon={faCircleInfo} />
                      </OverlayTrigger>
                    </Col>
                  </Row>
                  <Row className="mb-1">
                    <Col>
                      <b>SINR</b>
                    </Col>
                    <Col>{cellData?.signal?.["5g"].sinr} dB</Col>
                    <Col>
                      <OverlayTrigger
                        trigger="click"
                        placement="right"
                        overlay={sinrPop}
                      >
                        <FontAwesomeIcon icon={faCircleInfo} />
                      </OverlayTrigger>
                    </Col>
                  </Row>
                </Container>
              ) : (
                <Spinner animation="border" />
              )}
            </Card.Body>
          </Card>
        </CardGroup>
        Refreshes every 5 seconds
      </Container>
    </div>
  );
};

export default Signal;
