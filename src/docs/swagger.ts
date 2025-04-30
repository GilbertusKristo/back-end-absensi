import swaggerAutogen from "swagger-autogen";

const doc = {
    info: {
        version: "v0.0.1",
        title: "Dokumentasi API Event",
        description: "Dokumentasi API Event",
    },
    servers: [
        {
            url: "http://localhost:3000/api",
            description: "Lokal server",
        },
        {
            url: "https://back-end-absensi.vercel.app/api",
            description: "Deploy server",
        },
    ],
    components: {
        securitySchemes: {
            bearerAuth: {
                type: "http",
                scheme: "bearer",
            },
        },
        schemas: {
            LoginRequest: {
                identifier: "johndoe",
                password: "Password123",
            },
            RegisterRequest: {
                fullName: "John Doe",
                username: "johndoe",
                password: "Password123",
                confirmPassword: "Password123",
            },
            ActivationRequest: {
                code: "abcdef",
            }
        }
    }
}

const outputFile = "./swagger_output.json";
const endpointFiles = ["./src/routes/api.ts"];


swaggerAutogen({ openapi: "3.0.0" })(outputFile, endpointFiles, doc);