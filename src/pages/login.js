import { useContext, useEffect, useState } from "react";
import { Form, Button, Alert, Spinner } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { loginUser } from "../modules/services";

const Login = () => {
  const [password, setPassword] = useState("");
  const [alertPassword, setAlertPassword] = useState(false);
  const [alertGateway, setAlertGateway] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { setUser } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    setUser(null);
  }, []);

  function handleSubmit(event) {
    setIsLoading(true);
    event.preventDefault();

    loginUser({ username: "admin", password: password })
      .then((response) => {
        console.log(response);
        setUser({ token: response.data.auth.token, password: password });
        setIsLoading(false);
        navigate("/", { replace: true });
      })
      .catch((error) => {
        console.log(error.message);
        console.log(error.toJSON());
        if (error.message === "timeout of 4000ms exceeded") {
          setAlertGateway(true);
          setIsLoading(false);
        } else if (error.response.status === 401) {
          setAlertPassword(true);
          setIsLoading(false);
        } else if (error.response.status >= 500) {
          setAlertGateway(true);
          setIsLoading(false);
        }
      });
  }

  return (
    <>
      {alertPassword ? (
        <Alert
          variant="danger"
          onClose={() => setAlertPassword(false)}
          dismissible
        >
          <Alert.Heading>Invalid Password</Alert.Heading>
          <p>
            Please re-enter your password and try again. If you have not changed
            your Gateway's password, you can find it on the bottom of the
            device.
          </p>
        </Alert>
      ) : (
        <></>
      )}

      {alertGateway ? (
        <Alert
          variant="danger"
          onClose={() => setAlertGateway(false)}
          dismissible
        >
          <Alert.Heading>Unable to connect to Gateway</Alert.Heading>
          <p>
            If you have just re-booted the gateway or changed your wireless
            settings, please allow for up to 90 seconds before trying to log
            back in.
          </p>
        </Alert>
      ) : (
        <></>
      )}

      <Form onSubmit={handleSubmit} className="w-25 mx-auto">
        <h1>Log In</h1>
        <Form.Group className="mb-3" controlId="formPlaintextEmail">
          <Form.Label>Username</Form.Label>
          <Form.Control
            placeholder="admin"
            aria-label="Disabled input example"
            disabled
            readOnly
          />
        </Form.Group>

        <Form.Group className="mb-3" controlId="formBasicPassword">
          <Form.Label>Password</Form.Label>
          <Form.Control
            type="password"
            placeholder="Password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </Form.Group>
        {isLoading ? (
          <Button variant="warning" disabled>
            <Spinner
              as="span"
              animation="grow"
              size="sm"
              role="status"
              aria-hidden="true"
            />
            Loading...
          </Button>
        ) : (
          <Button variant="warning" type="submit">
            Submit
          </Button>
        )}
      </Form>
    </>
  );
};

export default Login;
