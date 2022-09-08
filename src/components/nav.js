import { useContext } from "react";
import { Link } from "react-router-dom";
import Container from "react-bootstrap/Container";
import Nav from "react-bootstrap/Nav";
import Navbar from "react-bootstrap/Navbar";
import "bootstrap/dist/css/bootstrap.min.css";
import { AuthContext } from "../context/AuthContext";

const NavContainer = () => {
  const { user } = useContext(AuthContext);

  return (
    <Navbar bg="dark" variant="dark">
      <Container>
        <Navbar.Brand className="text-warning">KVD Admin</Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          {user && (
            <Nav className="me-auto">
              <Nav.Link as={Link} to="/">
                Signal
              </Nav.Link>
              <Nav.Link as={Link} to="/wifi">
                WiFi
              </Nav.Link>
              <Nav.Link as={Link} to="/system">
                System
              </Nav.Link>
            </Nav>
          )}
        </Navbar.Collapse>
        <Nav className="ml-auto">
          <Nav.Link as={Link} to="/login" className="text-warning">
            Logout
          </Nav.Link>
        </Nav>
      </Container>
    </Navbar>
  );
};

export default NavContainer;
