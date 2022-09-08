import { Popover } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";

export const band4Pop = (
  <Popover id="popover-basic1">
    <Popover.Header as="h3">Band</Popover.Header>
    <Popover.Body>
      The frequency range being used to connect to the T-Mobile cellular
      network.
      <br />
      <br />
      Extended range bands are either Band 12 (700MHz) or Band 71 (600 MHz).
      Greater maximum speed bands are either Band 2 (1900 MHz), Band 5 (850
      MHz), Band 4 (1700/2100 MHz), or Band 66 (extension of Band 4).
    </Popover.Body>
  </Popover>
);

export const band5Pop = (
  <Popover id="popover-basic5">
    <Popover.Header as="h3">Band</Popover.Header>
    <Popover.Body>
      The frequency range being used to connect to the T-Mobile cellular
      network.
      <br />
      <br />
      The extended range band is Band n71 (600MHz), while the greater maximum
      speed band is Band n41 (2.5 GHz).
    </Popover.Body>
  </Popover>
);

export const rsrpPop = (
  <Popover id="popover-basic2">
    <Popover.Header as="h1">RSRP</Popover.Header>
    <Popover.Body>
      <b>Reference Signal Recieved Power</b> <br />A measure of cellular signal
      strength recieved by your gateway.
      <br />
      <br />
      RSRP is always a negative number and typically ranges from -44 dBm to -140
      dBm, with a value of -80 or higher being ideal.
    </Popover.Body>
  </Popover>
);

export const rsrqPop = (
  <Popover id="popover-basic3">
    <Popover.Header as="h3">RSRQ</Popover.Header>
    <Popover.Body>
      <b>Reference Signal Recieved Quality</b> <br />A value that reflects the
      quality of the recieved pilot signals.
      <br />
      <br />A measure is always a negative number and typically ranges from -3
      and -20dBM, with a value of -10 or higher being ideal.
    </Popover.Body>
  </Popover>
);

export const sinrPop = (
  <Popover id="popover-basic4">
    <Popover.Header as="h3">SINR</Popover.Header>
    <Popover.Body>
      <b>Signal Interference to Noise Ratio</b> <br />A measure of the amount of
      cellular signal interference (or "noise") recieved by your gateway.
      <br />
      <br />
      SINR can be a postive or negative number, with a value of 20 or higher
      being ideal.
    </Popover.Body>
  </Popover>
);
