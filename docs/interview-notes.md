# HomeRent — Interview Notes for Freshers

Simple explanations for every part of the project. Read this before your interview.

---

## 1. What Does Each Main File Do?

### Server (Backend)

| File | What it does |
|------|-------------|
| `server.js` | Entry point. Starts Express, loads middleware (helmet, cors, json limit), registers routes, starts listening on PORT. |
| `config/db.js` | Connects to MongoDB using Mongoose. Reads `MONGO_URI` from `.env`. |
| `models/User.js` | Defines the User schema. Password is hashed before saving (bcrypt). Has `matchPassword()` method for login. |
| `models/Property.js` | Defines the Property schema with indexes for fast search. |
| `controllers/authController.js` | register, login, getMe. Uses JWT to create tokens. |
| `controllers/propertyController.js` | CRUD for properties + search/filter/sort/pagination. |
| `controllers/userController.js` | Save/unsave property, get saved list, update profile. |
| `middleware/authMiddleware.js` | `protect` — reads Bearer token from header, verifies JWT, attaches `req.user`. `landlordOnly` — checks role. |
| `middleware/validatorMiddleware.js` | Input rules using express-validator. Returns 400 if data is invalid. |
| `middleware/errorMiddleware.js` | `notFound` (404 for unknown routes) + `errorHandler` (formats any error into clean JSON). |
| `routes/*.js` | Map HTTP methods + URLs to controller functions. |

### Client (Frontend)

| File | What it does |
|------|-------------|
| `main.jsx` | ReactDOM entry point. Renders `<App />`. |
| `App.jsx` | Sets up React Router routes and wraps with AuthProvider and SavedProvider. |
| `context/AuthContext.jsx` | Global auth state (user, login, register, logout). Saves user + JWT to localStorage. |
| `context/SavedContext.jsx` | Tracks which property IDs are saved by the current user. |
| `services/api.js` | Axios instance. Attaches JWT from localStorage to every request. All API call functions live here. |
| `pages/HomePage.jsx` | Hero section + featured 6 properties fetched from `/api/properties`. |
| `pages/PropertiesPage.jsx` | Search, filter, sort, paginate. Reads URL params and sends them to the API. |
| `pages/PropertyDetailPage.jsx` | Fetches one property. Shows detail + similar listings + inquiry form. |
| `pages/LoginPage.jsx` | Login form. Calls `AuthService.login()`. On success, saves user to context. |
| `pages/DashboardPage.jsx` | Shows saved properties for the logged-in user. |
| `pages/MyPropertiesPage.jsx` | Landlord's listings. Full CRUD — add, edit, delete, toggle availability. |
| `pages/AddEditPropertyPage.jsx` | Form to create or update a property. |
| `components/ProtectedRoute.jsx` | Wraps routes that need login. Redirects to `/login` if not authenticated. |

---

## 2. Key Flows (How the App Works Step by Step)

### Flow A — JWT Login

```
1. User types email + password → clicks "Sign In"
2. LoginPage calls AuthService.login()
3. Axios sends POST /api/auth/login with { email, password }
4. Express → rate limiter → validateLogin → authController.login()
5. Controller finds user by email (includes password field)
6. bcrypt.compare(enteredPassword, hashedPassword) → true or false
7. If true → jwt.sign({ id }, JWT_SECRET) → returns { _id, name, email, role, token }
8. Frontend saves user object (with token) to React Context AND localStorage
9. All future Axios requests attach: Authorization: Bearer <token>
```

### Flow B — Landlord Adds a Property

```
1. Landlord fills the Add Property form → clicks Submit
2. AddEditPropertyPage calls PropertyService.create(data)
3. Axios sends POST /api/properties (with Bearer token)
4. Server: protect middleware → verifies JWT → attaches req.user
5. Server: landlordOnly middleware → checks req.user.role === 'landlord'
6. Server: validateCreateProperty → checks title, type, price, city, etc.
7. propertyController.createProperty() → Property.create({ ...data, owner: req.user._id })
8. Returns new property with 201 status
9. Frontend navigates to My Listings page
```

### Flow C — Search with Filters and Server-Side Pagination

```
1. User sets city = "Pune", bedrooms = "2", minRent = "10000" → clicks Search
2. PropertiesPage builds a query params object and calls PropertyService.getAll()
3. api.js maps params to backend names: { city: "Pune", bedrooms: "2", minPrice: "10000", page: 1, limit: 9 }
4. Axios sends GET /api/properties?city=Pune&bedrooms=2&minPrice=10000&page=1&limit=9
5. propertyController.getProperties() builds a Mongoose filter object
6. MongoDB uses compound index { city, price, bedrooms } → IXSCAN (fast)
7. Returns { properties: [...], total: 14, page: 1, pages: 2 }
8. Frontend shows 9 cards, pagination shows 2 pages
```

### Flow D — Save a Property

```
1. Tenant clicks heart icon on a PropertyCard
2. SavedContext.toggleSave(propertyId) is called
3. Axios sends POST /api/users/save/:propertyId (with Bearer token)
4. protect middleware verifies JWT
5. userController.toggleSaveProperty() finds the user, checks savedProperties array
6. If NOT saved: push propertyId to array → save() → returns { saved: true }
7. If already saved: filter out the ID → save() → returns { saved: false }
8. SavedContext updates local savedIds state → heart icon turns red/grey
```

---

## 3. Interview Questions and Short Answers

**Q1. What is JWT and why do we use it?**
JWT = JSON Web Token. The server signs a small JSON object (containing the user ID) with a secret key and sends it to the client. The client stores it and sends it back with every request. The server verifies the signature to confirm the user's identity — no session storage needed on the server.

**Q2. What is bcrypt? Why do we hash passwords?**
bcrypt is a password hashing library. Hashing converts a plain password into a fixed-length string that cannot be reversed. We store the hash, never the plain password. When the user logs in, we hash what they type and compare it to the stored hash using `bcrypt.compare()`.

**Q3. What is middleware in Express?**
Middleware is a function that runs between the request arriving and the response being sent. Examples in this project: `protect` (checks the JWT), `validateRegister` (checks input), `helmet` (sets security headers), `errorHandler` (catches all errors). Middleware uses `next()` to pass control to the next function.

**Q4. What does express-validator do?**
It checks the request body for required fields, correct formats (email, number), and length constraints. If validation fails, our `handleValidationErrors` middleware returns a 400 response with a clear message — so invalid data never reaches the database.

**Q5. What does Helmet do?**
Helmet sets security-related HTTP headers automatically: `X-Content-Type-Options`, `X-Frame-Options`, `Content-Security-Policy`, etc. These protect against common attacks like clickjacking, MIME sniffing, and cross-site scripting.

**Q6. What is rate limiting?**
Rate limiting restricts how many requests an IP address can make in a time window. We limit `/api/auth/*` to 50 requests per 15 minutes. This prevents brute-force password guessing attacks.

**Q7. What is CORS and why do we need it?**
CORS (Cross-Origin Resource Sharing) is a browser security rule that blocks a webpage from calling an API on a different domain. Our frontend is on `localhost:5173` and backend on `localhost:5000` — different ports, so we need to explicitly allow the frontend origin in the server's `cors()` middleware.

**Q8. What is a MongoDB Index? What is COLLSCAN vs IXSCAN?**
An index is like a sorted shortcut that MongoDB uses to find documents faster. Without an index, MongoDB does a COLLSCAN (Collection Scan) — it reads every document. With an index, it does an IXSCAN (Index Scan) — it jumps directly to matching documents. In this project, the compound index `{ city, type, price }` speeds up the most common rental search queries.

**Q9. What is a compound index and why did you add one?**
A compound index covers multiple fields. For example, `{ city: 1, type: 1, price: 1 }` speeds up queries that filter by city AND type AND sort by price — all with one index. MongoDB can also use this index for city-only queries (using the prefix), so we removed the redundant standalone `{ city: 1 }` index.

**Q10. What is REST?**
REST is an API design style where you use HTTP methods to describe actions: GET = read, POST = create, PUT = update, DELETE = delete. Resources are identified by URLs (`/api/properties/:id`). Our entire backend follows REST conventions.

**Q11. What is React Context API?**
Context API lets you share state across many components without passing props through every level. We use `AuthContext` to share `user`, `login`, `logout` and `isLandlord` across the entire app without prop drilling.

**Q12. What are protected routes?**
A ProtectedRoute component wraps any route that requires login. It reads the `user` from AuthContext. If the user is not logged in, it redirects to `/login`. If `landlordOnly` is set, it also checks the role.

**Q13. Explain the full MERN flow for "browse properties".**
1. User visits `/properties` in the browser (React).
2. PropertiesPage component mounts, calls `PropertyService.getAll()`.
3. Axios sends `GET http://localhost:5000/api/properties?city=Pune&page=1&limit=9`.
4. Express routes it to `getProperties()` controller.
5. Controller builds a Mongoose filter, runs `Property.find()` with indexes.
6. MongoDB returns matching documents.
7. Controller sends `{ properties, total, page, pages }` as JSON.
8. React updates state, renders PropertyCard components.

**Q14. What would you improve if you had more time?**
- Add refresh tokens so users stay logged in without re-entering password.
- Integrate Cloudinary for real image uploads instead of URLs.
- Add Nodemailer for the inquiry form to actually send emails.
- Expand Jest test coverage (currently only 4 basic tests).
- Add Redis caching for the property list endpoint.
- Use cursor-based pagination for large datasets.

**Q15. How does server-side pagination work?**
The client sends `?page=2&limit=9`. The server calculates `skip = (page - 1) * limit = 9` and runs `.skip(9).limit(9)` on the query. It also runs `countDocuments()` for the total. The client receives `{ properties, total, pages }` and shows page numbers accordingly.

**Q16. What is the difference between authentication and authorization?**
Authentication = "Who are you?" (login + JWT verification). Authorization = "Are you allowed to do this?" (role checks like `landlordOnly`, owner-only 403 on update/delete).

**Q17. Why do we use `select: false` on the password field?**
So that password is never returned in any query by default. Only when we explicitly call `.select('+password')` (in the login controller) do we get it. This prevents accidentally leaking passwords in API responses.

**Q18. What is async/await and why do you use it?**
`async/await` is a clean way to write asynchronous JavaScript. Instead of `.then()` chains, we `await` a Promise directly. It makes the code look synchronous and easier to read. In Express, any async error automatically propagates to the error handler (Express 5 supports this natively).

**Q19. What does `populate()` do in Mongoose?**
`populate()` replaces a stored ObjectId reference with the actual document it points to. For example, a Property stores `owner: ObjectId(...)`. Calling `.populate('owner', 'name email')` replaces that ID with the actual User document's name and email.

**Q20. How does the save/unsave (toggle) work?**
The server stores an array of property ObjectIds in the user's `savedProperties` field. On toggle: check if the ID exists in the array. If yes — filter it out (unsave). If no — push it in (save). Then call `user.save()`. Simple, no extra collection needed.

---

## 4. Two-Minute Project Pitch

> "HomeRent is a full-stack MERN web application I built to simulate a real rental property marketplace.
>
> On the backend I used Node.js and Express with MongoDB. I implemented JWT authentication with bcrypt password hashing, input validation with express-validator, security headers with Helmet, and rate limiting on auth routes. I also optimised database queries using compound indexes and text indexes, which reduced documents examined from 100 to 8–30 in tests.
>
> On the frontend I used React with React Router for client-side routing, Context API for global auth and saved-properties state, and Axios for all API calls. The UI has search with filters, server-side pagination, property save/unsave, and landlord CRUD — add, edit, delete listings.
>
> I followed a clean project structure — separate controllers, routes, middleware, and services. I wrote 4 Jest + Supertest tests for the auth and property endpoints. The app is ready to deploy: the backend can go on Render and the frontend on Vercel."
