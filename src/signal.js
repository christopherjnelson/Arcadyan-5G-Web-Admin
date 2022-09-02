import React, { useState, useEffect } from "react";
import Card from "react-bootstrap/Card";
import CardGroup from "react-bootstrap/CardGroup";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Container from "react-bootstrap/Container";
import "bootstrap/dist/css/bootstrap.min.css";

function Signal() {
  const [cellData, setCellData] = useState();

  const fetchData = () => {
    console.log("fetching gateway data");
    fetch("/TMI/v1/gateway?get=all", { method: "GET" })
      .then((response) => response.json())
      .then((data) => {
        setCellData(data);
      })
      .catch(function (error) {
        setCellData();
        console.log(error);
      });
  };

  useEffect(() => {
    setCellData();
    fetchData();
    const interval = setInterval(() => {
      fetchData();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  if (cellData) {
    return (
      <div className="App">
        <Container>
          <h3 className="mt-2">Signal Metrics</h3>
          <CardGroup>
            <Card bg="dark" text="light" className="m-2 rounded">
              <Card.Body>
                <Card.Title>Gateway</Card.Title>
                <Container>
                  <Row>
                    <Col>HWVersion</Col>
                    <Col>{cellData.device.hardwareVersion}</Col>
                  </Row>
                  <Row>
                    <Col>MAC</Col>
                    <Col></Col>
                  </Row>
                  <Row>
                    <Col>Manufacturer</Col>
                    <Col>{cellData.device.manufacturer}</Col>
                  </Row>
                  <Row>
                    <Col>Model</Col>
                    <Col>{cellData.device.model}</Col>
                  </Row>
                  <Row>
                    <Col>SN</Col>
                    <Col></Col>
                  </Row>
                  <Row>
                    <Col>Firmware</Col>
                    <Col>{cellData.device.softwareVersion}</Col>
                  </Row>
                </Container>
              </Card.Body>
            </Card>
            <Card bg="dark" text="light" className="m-2 rounded">
              <Card.Body>
                <Card.Title>LTE</Card.Title>
                <Container>
                  <Row>
                    <Col>Band</Col>
                    <Col>{cellData.signal["4g"].bands}</Col>
                  </Row>
                  <Row>
                    <Col>Signal</Col>
                    <Col>{cellData.signal["4g"].bars} Bars</Col>
                  </Row>
                  <Row>
                    <Col>RSRP</Col>
                    <Col>{cellData.signal["4g"].rsrp} dBm</Col>
                  </Row>
                  <Row>
                    <Col>RSRQ</Col>
                    <Col>{cellData.signal["4g"].rsrq} dB</Col>
                  </Row>
                  <Row>
                    <Col>SINR</Col>
                    <Col>{cellData.signal["4g"].sinr}</Col>
                  </Row>
                </Container>
              </Card.Body>
            </Card>
            <Card bg="dark" text="light" className="m-2 rounded">
              <Card.Body>
                <Card.Title>5G</Card.Title>
                <Container>
                  <Row>
                    <Col>Band</Col>
                    <Col>{cellData.signal["5g"].bands}</Col>
                  </Row>
                  <Row>
                    <Col>Signal</Col>
                    <Col>{cellData.signal["5g"].bars} Bars</Col>
                  </Row>
                  <Row>
                    <Col>RSRP</Col>
                    <Col>{cellData.signal["5g"].rsrp} dBm</Col>
                  </Row>
                  <Row>
                    <Col>RSRQ</Col>
                    <Col>{cellData.signal["5g"].rsrq} dB</Col>
                  </Row>
                  <Row>
                    <Col>SINR</Col>
                    <Col>{cellData.signal["5g"].sinr}</Col>
                  </Row>
                </Container>
              </Card.Body>
            </Card>
          </CardGroup>
          Refreshes every 10 seconds
        </Container>
      </div>
    );
  } else {
    return <h1> Loading.... </h1>;
  }
}

export default Signal;
