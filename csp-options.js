let options = {
 contentSecurityPolicy: {
  directives: {
   defaultSrc: ["'self'"],
   baseUri: ["'self'"],
   fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
   frameAncestors: ["'self'"],
   imgSrc: ["'self'", "data:"],
   objectSrc: ["'none'"],
   scriptSrc: ["'self'", "'unsafe-inline'"],
   scriptSrcAttr: ["'unsafe-inline'"],
   styleSrc: ["'self'", "https://fonts.googleapis.com", "'unsafe-inline'"],
   connectSrc: ["'self'"],
  },
 },
};

export default options;
