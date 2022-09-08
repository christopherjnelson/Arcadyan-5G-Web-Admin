import React, { createContext, useState } from "react";
// createContext is used to create a new context

export const AuthContext = createContext({
  user: {
    token: null,
    password: null,
  },
  setUser: () => {},
});
// AppContext is the name of my context and can be renamed

const AuthProvider = (props) => {
  const [user, setUser] = useState(null);

  return (
    // Whatever we pass into value will be available throughout your app
    <AuthContext.Provider value={{ user, setUser }}>
      {props.children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
