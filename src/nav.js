import Container from "react-bootstrap/Container";
import Nav from "react-bootstrap/Nav";
import Navbar from "react-bootstrap/Navbar";
import "bootstrap/dist/css/bootstrap.min.css";
import { Link } from "react-router-dom";

function NavContainer() {
  return (
    <Navbar bg="dark" variant="dark">
      <Container>
        <Nav className="container-fluid">
          <Nav.Item>
            <Navbar.Brand as={Link} to="/">
              KVD Admin
            </Navbar.Brand>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link as={Link} to="/">
              Signal
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link as={Link} to="/system">
              System
            </Nav.Link>
          </Nav.Item>
        </Nav>
      </Container>
    </Navbar>
  );
}

export default NavContainer;
