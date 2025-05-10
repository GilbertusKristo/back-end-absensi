import swaggerAutogen from "swagger-autogen";

const doc = {
    info: {
        version: "v0.0.1",
        title: "Dokumentasi API Absensi",
        description: "Dokumentasi API Absensi",
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
            ContactRequest: {
                firstName: "John",
                lastName: "Doe",
                email: "john.doe@example.com",
                address: "Jl. Mawar No. 123",
                phone: "081234567890"
            },
            UpdatePermissionStatusRequest: {
                "type": "object",
                "properties": {
                    "status": {
                        "type": "string",
                        "enum": ["Pending", "Disetujui", "Ditolak"],
                        "example": "Disetujui"
                    }
                }
            }


        }
    }
}

const outputFile = "./swagger_output.json";
const endpointFiles = ["./src/routes/api.ts"];


swaggerAutogen({ openapi: "3.0.0" })(outputFile, endpointFiles, doc);