# API Endpoints

This document is based on the current server implementation in `src/routes` and the controller/model files.

## Base URL

Local:

```txt
http://localhost:3000
```

Production origin currently allowed by CORS:

```txt
https://rooknomics.vercel.app
```

## Auth Behavior

- Most auth-protected routes use the `token` cookie.
- Backtest routes are different: they currently expect `Authorization: Bearer <token>`.
- `POST /api/auth/login` sets the JWT in a cookie and does not return the token in the body.
- `POST /api/auth/verify-otp` sets the JWT in a cookie and does not return the token in the body.
- `POST /api/auth/google` returns the JWT in the response body as `token`.

## Mounted Endpoints

### `POST /api/auth/register`

Starts local account registration by creating a pending OTP record and emailing the OTP.

Request body:

```json
{
  "name": "Rook User",
  "email": "rook@example.com",
  "password": "secret123"
}
```

Request fields:

- `name` `string` required
- `email` `string` required
- `password` `string` required, minimum 6 characters

Success response: `200 OK`

```json
{
  "message": "OTP sent to your email. Please verify to complete registration.",
  "email": "rook@example.com"
}
```

Error responses:

- `400` when any field is missing
- `400` when password is shorter than 6 characters
- `400` when the email is already registered
- `500` on server failure

### `POST /api/auth/verify-otp`

Verifies the OTP, creates the real user account, and sets the auth cookie.

Request body:

```json
{
  "email": "rook@example.com",
  "otp": "123456"
}
```

Request fields:

- `email` `string` required
- `otp` `string` required

Success response: `201 Created`

```json
{
  "message": "Email verified. Account created successfully.",
  "user": {
    "id": "67e7f4c22c6f8f0d7e2f4b11",
    "name": "Rook User",
    "email": "rook@example.com",
    "avatar": null
  }
}
```

Side effect:

- Sets `token` cookie

Error responses:

- `400` when `email` or `otp` is missing
- `400` when OTP is expired or no pending registration exists
- `400` when too many wrong attempts were made
- `400` when OTP is invalid
- `500` on server failure

### `POST /api/auth/resend-otp`

Generates and sends a fresh OTP for an existing pending registration.

Request body:

```json
{
  "email": "rook@example.com"
}
```

Success response: `200 OK`

```json
{
  "message": "A new OTP has been sent to your email."
}
```

Error responses:

- `400` when `email` is missing
- `400` when there is no pending registration
- `500` on server failure

### `POST /api/auth/login`

Authenticates a local user and sets the auth cookie.

Request body:

```json
{
  "email": "rook@example.com",
  "password": "secret123"
}
```

Success response: `200 OK`

```json
{
  "user": {
    "id": "67e7f4c22c6f8f0d7e2f4b11",
    "name": "Rook User",
    "email": "rook@example.com",
    "avatar": null
  }
}
```

Side effect:

- Sets `token` cookie

Error responses:

- `400` when `email` or `password` is missing
- `401` when email is invalid
- `401` when password is invalid
- `500` on server failure

### `POST /api/auth/google`

Authenticates or creates a Google user.

Request body:

```json
{
  "googleId": "google-oauth-id",
  "email": "rook@example.com",
  "name": "Rook User",
  "avatar": "https://example.com/avatar.png"
}
```

Request fields:

- `googleId` `string` required
- `email` `string` required
- `name` `string` optional when matching an existing user
- `avatar` `string` optional

Success response: `200 OK`

```json
{
  "token": "jwt-token",
  "user": {
    "id": "67e7f4c22c6f8f0d7e2f4b11",
    "name": "Rook User",
    "email": "rook@example.com",
    "avatar": "https://example.com/avatar.png"
  }
}
```

Error responses:

- `400` when `googleId` or `email` is missing
- `500` on server failure

### `GET /api/auth/me`

Returns the currently authenticated user.

Auth:

- Requires `token` cookie

Success response: `200 OK`

```json
{
  "user": {
    "id": "67e7f4c22c6f8f0d7e2f4b11",
    "name": "Rook User",
    "email": "rook@example.com",
    "avatar": null
  }
}
```

Error responses:

- `401` when cookie token is missing
- `401` when token is invalid or expired
- `404` when user is not found
- `500` on server failure

### `POST /api/auth/logout`

Clears the auth cookie.

Success response: `200 OK`

```json
{
  "message": "Logged out successfully"
}
```

### `POST /api/simulations`

Stores a simulation for the logged-in user.

Auth:

- Requires `token` cookie

Request body:

```json
{
  "strategy": {
    "symbol": "AAPL",
    "startDate": "2024-01-01",
    "endDate": "2024-12-31",
    "capital": 10000,
    "activeRules": ["rsi", "maCross"],
    "rulesConfig": {
      "rsi": {
        "enabled": true,
        "period": 14,
        "buyBelow": 30,
        "sellAbove": 70
      },
      "maCross": {
        "enabled": true,
        "type": "SMA",
        "fastPeriod": 20,
        "slowPeriod": 50
      }
    }
  },
  "performance": {
    "totalReturn": 18.5,
    "benchmarkReturn": 11.2,
    "finalValue": 11850,
    "benchmarkFinalValue": 11120,
    "maxDrawdown": -7.8,
    "sharpeRatio": 1.42,
    "dailyVolatility": 1.13,
    "numberOfTrades": 8,
    "winRate": 62.5,
    "profitFactor": 1.9,
    "avgHoldingDays": 14
  },
  "trades": [
    {
      "date": "2024-03-01",
      "type": "BUY",
      "price": 180.45,
      "shares": 10,
      "signal": "rsi",
      "pnl": null,
      "pnlPct": null,
      "totalValue": 1804.5,
      "holdingDays": null
    }
  ],
  "verdict": {
    "status": "OUTPERFORMED",
    "summary": "Strategy beat the benchmark over the selected period.",
    "insights": [
      "Higher return than buy-and-hold",
      "Drawdown remained controlled"
    ]
  }
}
```

Required top-level fields:

- `strategy` `object`
- `performance` `object`
- `trades` `array`
- `verdict` `object`

Success response: `201 Created`

```json
{
  "simulation": {
    "_id": "67e7f6dc2c6f8f0d7e2f4b55",
    "userId": "67e7f4c22c6f8f0d7e2f4b11",
    "strategy": {
      "symbol": "AAPL",
      "startDate": "2024-01-01",
      "endDate": "2024-12-31",
      "capital": 10000,
      "activeRules": ["rsi", "maCross"],
      "rulesConfig": {}
    },
    "performance": {
      "totalReturn": 18.5,
      "benchmarkReturn": 11.2,
      "finalValue": 11850,
      "benchmarkFinalValue": 11120,
      "maxDrawdown": -7.8,
      "sharpeRatio": 1.42,
      "dailyVolatility": 1.13,
      "numberOfTrades": 8,
      "winRate": 62.5,
      "profitFactor": 1.9,
      "avgHoldingDays": 14
    },
    "trades": [
      {
        "date": "2024-03-01",
        "type": "BUY",
        "price": 180.45,
        "shares": 10,
        "signal": "rsi",
        "pnl": null,
        "pnlPct": null,
        "totalValue": 1804.5,
        "holdingDays": null
      }
    ],
    "verdict": {
      "status": "OUTPERFORMED",
      "summary": "Strategy beat the benchmark over the selected period.",
      "insights": [
        "Higher return than buy-and-hold",
        "Drawdown remained controlled"
      ]
    },
    "createdAt": "2026-03-29T17:00:00.000Z",
    "updatedAt": "2026-03-29T17:00:00.000Z"
  }
}
```

Error responses:

- `401` when cookie token is missing
- `401` when token is invalid or expired
- `400` when any required top-level field is missing
- `500` on server failure

### `GET /api/simulations`

Returns all simulations for the logged-in user, newest first.

Auth:

- Requires `token` cookie

Success response: `200 OK`

```json
{
  "simulations": [
    {
      "_id": "67e7f6dc2c6f8f0d7e2f4b55",
      "strategy": {
        "symbol": "AAPL",
        "startDate": "2024-01-01",
        "endDate": "2024-12-31",
        "capital": 10000,
        "activeRules": ["rsi", "maCross"],
        "rulesConfig": {}
      },
      "performance": {
        "totalReturn": 18.5,
        "benchmarkReturn": 11.2,
        "finalValue": 11850,
        "benchmarkFinalValue": 11120,
        "maxDrawdown": -7.8,
        "sharpeRatio": 1.42,
        "dailyVolatility": 1.13,
        "numberOfTrades": 8,
        "winRate": 62.5,
        "profitFactor": 1.9,
        "avgHoldingDays": 14
      },
      "verdict": {
        "status": "OUTPERFORMED",
        "summary": "Strategy beat the benchmark over the selected period.",
        "insights": [
          "Higher return than buy-and-hold"
        ]
      },
      "createdAt": "2026-03-29T17:00:00.000Z"
    }
  ]
}
```

Selected fields only:

- `strategy`
- `performance`
- `verdict`
- `createdAt`

Error responses:

- `401` when cookie token is missing
- `401` when token is invalid or expired
- `500` on server failure

### `GET /api/simulations/:id`

Returns one simulation belonging to the logged-in user.

Auth:

- Requires `token` cookie

Path params:

- `id` MongoDB ObjectId

Success response: `200 OK`

```json
{
  "simulation": {
    "_id": "67e7f6dc2c6f8f0d7e2f4b55",
    "userId": "67e7f4c22c6f8f0d7e2f4b11",
    "strategy": {
      "symbol": "AAPL",
      "startDate": "2024-01-01",
      "endDate": "2024-12-31",
      "capital": 10000,
      "activeRules": ["rsi", "maCross"],
      "rulesConfig": {}
    },
    "performance": {
      "totalReturn": 18.5,
      "benchmarkReturn": 11.2,
      "finalValue": 11850,
      "benchmarkFinalValue": 11120,
      "maxDrawdown": -7.8,
      "sharpeRatio": 1.42,
      "dailyVolatility": 1.13,
      "numberOfTrades": 8,
      "winRate": 62.5,
      "profitFactor": 1.9,
      "avgHoldingDays": 14
    },
    "trades": [],
    "verdict": {
      "status": "OUTPERFORMED",
      "summary": "Strategy beat the benchmark over the selected period.",
      "insights": []
    },
    "createdAt": "2026-03-29T17:00:00.000Z",
    "updatedAt": "2026-03-29T17:00:00.000Z"
  }
}
```

Error responses:

- `401` when cookie token is missing
- `401` when token is invalid or expired
- `400` when `id` is not a valid ObjectId
- `404` when simulation is not found
- `500` on server failure

### `DELETE /api/simulations/:id`

Deletes one simulation belonging to the logged-in user.

Auth:

- Requires `token` cookie

Path params:

- `id` MongoDB ObjectId

Success response: `200 OK`

```json
{
  "message": "Simulation deleted"
}
```

Error responses:

- `401` when cookie token is missing
- `401` when token is invalid or expired
- `400` when `id` is not a valid ObjectId
- `404` when simulation is not found
- `500` on server failure

### `POST /api/backtests`

Runs a backtest, saves it, and returns the generated results.

Auth:

- Requires `Authorization: Bearer <jwt>`
- This route does not use the cookie-based `protect` middleware

Request body:

```json
{
  "name": "RSI + MA Cross on AAPL",
  "symbol": "AAPL",
  "startDate": "2024-01-01",
  "endDate": "2024-12-31",
  "capital": 10000,
  "activeRules": ["rsi", "maCross"],
  "rulesConfig": {
    "rsi": {
      "enabled": true,
      "period": 14,
      "buyBelow": 30,
      "sellAbove": 70
    },
    "maCross": {
      "enabled": true,
      "type": "SMA",
      "fastPeriod": 20,
      "slowPeriod": 50
    }
  }
}
```

Request fields:

- `name` `string` required
- `symbol` `string` required
- `startDate` `string` required, expected ISO-like date
- `endDate` `string` required, expected ISO-like date
- `capital` `number` required
- `activeRules` `string[]` required
- `rulesConfig.rsi` optional object
- `rulesConfig.maCross` optional object

Success response: `201 Created`

```json
{
  "message": "Backtest saved successfully",
  "backtestId": "67e7f8be2c6f8f0d7e2f4c12",
  "results": {
    "performance": {
      "totalReturn": 18.5,
      "benchmarkReturn": 11.2,
      "finalValue": 11850,
      "benchmarkFinalValue": 11120,
      "maxDrawdown": -7.8,
      "sharpeRatio": 1.42,
      "dailyVolatility": 1.13,
      "numberOfTrades": 8,
      "winRate": 62.5,
      "profitFactor": 1.9,
      "avgHoldingDays": 14
    },
    "trades": [
      {
        "date": "2024-03-01",
        "type": "BUY",
        "price": 180.45,
        "shares": 10,
        "signal": "rsi",
        "pnl": null,
        "pnlPct": null,
        "totalValue": 1804.5,
        "holdingDays": null
      }
    ],
    "verdict": {
      "status": "OUTPERFORMED",
      "summary": "Strategy beat the benchmark over the selected period.",
      "insights": [
        "Higher return than benchmark"
      ]
    }
  }
}
```

Error responses:

- `401` when bearer token is missing
- `403` when bearer token is invalid
- `400` when required fields are missing
- `500` on server failure

### `GET /api/backtests`

Returns paginated saved backtests for the authenticated user.

Auth:

- Requires `Authorization: Bearer <jwt>`

Query params:

- `page` optional number, default `1`
- `limit` optional number, default `10`
- `symbol` optional string
- `verdict` optional string

Example:

```txt
/api/backtests?page=1&limit=10&symbol=AAPL&verdict=OUTPERFORM
```

Success response: `200 OK`

```json
{
  "backtests": [
    {
      "_id": "67e7f8be2c6f8f0d7e2f4c12",
      "name": "RSI + MA Cross on AAPL",
      "symbol": "AAPL",
      "startDate": "2024-01-01",
      "endDate": "2024-12-31",
      "initialCapital": 10000,
      "results": {
        "verdict": {
          "type": "OUTPERFORM",
          "title": "Outperformed benchmark",
          "desc": "The strategy delivered a stronger return."
        },
        "benchmark": {
          "strategy": 18.5,
          "benchmark": 11.2,
          "finalValue": 11850
        }
      },
      "createdAt": "2026-03-29T17:10:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 1,
    "totalBacktests": 1
  }
}
```

Error responses:

- `401` when bearer token is missing
- `403` when bearer token is invalid
- `500` on server failure

### `GET /api/backtests/:id`

Returns one saved backtest for the authenticated user.

Auth:

- Requires `Authorization: Bearer <jwt>`

Path params:

- `id` string

Success response: `200 OK`

The handler returns the full backtest document directly:

```json
{
  "_id": "67e7f8be2c6f8f0d7e2f4c12",
  "userId": "67e7f4c22c6f8f0d7e2f4b11",
  "name": "RSI + MA Cross on AAPL",
  "symbol": "AAPL",
  "startDate": "2024-01-01",
  "endDate": "2024-12-31",
  "initialCapital": 10000,
  "activeRules": ["rsi", "maCross"],
  "rulesConfig": {
    "rsi": {
      "enabled": true,
      "period": 14,
      "buyBelow": 30,
      "sellAbove": 70
    },
    "maCross": {
      "enabled": true,
      "type": "SMA",
      "fastPeriod": 20,
      "slowPeriod": 50
    }
  },
  "results": {
    "performance": {
      "totalReturn": 18.5,
      "benchmarkReturn": 11.2,
      "finalValue": 11850,
      "benchmarkFinalValue": 11120,
      "maxDrawdown": -7.8,
      "sharpeRatio": 1.42,
      "dailyVolatility": 1.13,
      "numberOfTrades": 8,
      "winRate": 62.5,
      "profitFactor": 1.9,
      "avgHoldingDays": 14
    },
    "trades": [
      {
        "date": "2024-03-01",
        "type": "BUY",
        "price": 180.45,
        "shares": 10,
        "signal": "rsi",
        "pnl": null,
        "pnlPct": null,
        "totalValue": 1804.5,
        "holdingDays": null
      }
    ],
    "verdict": {
      "status": "OUTPERFORMED",
      "summary": "Strategy beat the benchmark over the selected period.",
      "insights": [
        "Higher return than benchmark"
      ]
    }
  },
  "createdAt": "2026-03-29T17:10:00.000Z",
  "updatedAt": "2026-03-29T17:10:00.000Z"
}
```

Error responses:

- `401` when bearer token is missing
- `403` when bearer token is invalid
- `400` when `id` is invalid or missing
- `404` when backtest is not found
- `500` on server failure

### `DELETE /api/backtests/:id`

Deletes one saved backtest for the authenticated user.

Auth:

- Requires `Authorization: Bearer <jwt>`

Success response: `200 OK`

```json
{
  "message": "Backtest deleted successfully"
}
```

Error responses:

- `401` when bearer token is missing
- `403` when bearer token is invalid
- `400` when `id` is invalid or missing
- `404` when backtest is not found
- `500` on server failure

## Handlers Present In Code But Not Mounted

These handlers exist in the codebase, but no active route registration currently exposes them in `src/routes/routes.ts`.

### `POST /backtest`

Handler file:

- `src/controller/data.controller.ts`

Intended request body:

```json
{
  "symbol": "AAPL",
  "startDate": "2024-01-01",
  "endDate": "2024-12-31",
  "capital": 10000,
  "activeRules": ["rsi", "maCross"],
  "rulesConfig": {
    "rsi": {
      "enabled": true,
      "period": 14,
      "buyBelow": 30,
      "sellAbove": 70
    }
  }
}
```

Intended success response: `200 OK`

```json
{
  "performance": {
    "totalReturn": 18.5,
    "benchmarkReturn": 11.2,
    "finalValue": 11850,
    "benchmarkFinalValue": 11120,
    "maxDrawdown": -7.8,
    "sharpeRatio": 1.42,
    "dailyVolatility": 1.13,
    "numberOfTrades": 8,
    "winRate": 62.5,
    "profitFactor": 1.9,
    "avgHoldingDays": 14
  },
  "trades": [
    {
      "date": "2024-03-01",
      "type": "BUY",
      "price": 180.45,
      "shares": 10,
      "signal": "rsi",
      "pnl": null,
      "pnlPct": null,
      "totalValue": 1804.5,
      "holdingDays": null
    }
  ],
  "verdict": {
    "status": "OUTPERFORMED",
    "summary": "Strategy beat the benchmark over the selected period.",
    "insights": []
  }
}
```

### `GET /api/prices?symbol=...&start=...&end=...`

Handler file:

- `src/api/prices.ts`

Required query params:

- `symbol`
- `start`
- `end`

Intended success response: `200 OK`

```json
[
  {
    "date": "2024-01-02",
    "open": 185.64,
    "high": 186.4,
    "low": 182.73,
    "close": 183.94,
    "volume": 82488700
  }
]
```

Possible errors:

- `400` when required query params are missing
- `502` when Yahoo Finance is unavailable or returns malformed data

## Notes For Frontend Integration

- Use `credentials: 'include'` for cookie-based auth routes under `/api/auth` and `/api/simulations`.
- Do not assume a single auth strategy across the whole API. Backtest routes currently use bearer auth, not the cookie.
- `GET /api/backtests/:id` returns the raw document directly, while most other endpoints wrap the resource inside an object like `{ user }` or `{ simulation }`.
- The backtest model type definitions and the actual saved `results` payload are not fully aligned in the current code. The docs above follow the runtime controller response shape where possible.
