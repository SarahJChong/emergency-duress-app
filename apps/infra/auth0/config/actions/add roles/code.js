exports.onExecutePostLogin = async (event, api) => {
  const namespace = "emergency_app";
  if (event.authorization) {
    api.idToken.setCustomClaim(`${namespace}/roles`, event.authorization.roles);
    api.accessToken.setCustomClaim(
      `${namespace}/roles`,
      event.authorization.roles
    );
    api.accessToken.setCustomClaim("name", event.user.name || event.user.given_name || event.user.nickname || "");
    api.accessToken.setCustomClaim("email", event.user.email);
  }
};