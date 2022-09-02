import React, { useState, useEffect } from "react";
import Table from "react-bootstrap/Table";

function Signal() {
  const [cellData, setCellData] = useState();

  const fetchData = () => {
    console.log("fetching gateway data");
    fetch("/TMI/v1/gateway?get=signal", { method: "GET" })
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
    fetchData();
    const interval = setInterval(() => {
      fetchData();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  if (cellData) {
    return (
      <div className="App">
        <h3>Signal Metrics</h3>
        <Table striped bordered hover>
          <thead>
            <tr>
              <th>#</th>
              <th>Band</th>
              <th>Signal</th>
              <th>RSRP</th>
              <th>RSRQ</th>
              <th>SINR </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>LTE</td>
              <td>{cellData.signal["4g"].bands}</td>
              <td>{cellData.signal["4g"].bars} Bars</td>
              <td>{cellData.signal["4g"].rsrp} dBm</td>
              <td>{cellData.signal["4g"].rsrq} dB</td>
              <td>{cellData.signal["4g"].sinr}</td>
            </tr>
            <tr>
              <td>5G</td>
              <td>{cellData.signal["5g"].bands}</td>
              <td>{cellData.signal["5g"].bars} Bars</td>
              <td>{cellData.signal["5g"].rsrp} dBm</td>
              <td>{cellData.signal["5g"].rsrq} dB</td>
              <td>{cellData.signal["5g"].sinr}</td>
            </tr>
          </tbody>
        </Table>
        Refreshes every 10 seconds
      </div>
    );
  } else {
    return <h1> Loading.... </h1>;
  }
}

export default Signal;
