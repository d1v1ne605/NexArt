"use strict";

import { Sequelize } from "sequelize";
import config from "../config/config.mysql.js";

const { username, password, nameDb, host, port, ssl } = config.db;

class Database {
    constructor() {
        this.connect();
    }

    connect(type = "mysql") {
        if (1 === 1) {
            // Enable logging in development
            this.sequelize = new Sequelize(nameDb, username, password, {
                host: host || "localhost",
                port: port || 3306,
                dialect: "mysql",
                dialectOptions: {
                    ssl: ssl
                },
                logging: console.log,
                pool: {
                    max: 50,
                    min: 0,
                    acquire: 30000,
                    idle: 10000,
                },
                define: {
                    timestamps: true,
                    underscored: true,
                },
            });
        } else {
            // Production settings
            this.sequelize = new Sequelize(nameDb, username, password, {
                host: host || "localhost",
                port: port || 3306,
                dialect: "mysql",
                logging: false,
                pool: {
                    max: 50,
                    min: 0,
                    acquire: 30000,
                    idle: 10000,
                },
                define: {
                    timestamps: true,
                    underscored: true,
                },
            });
        }

        this.authenticate();
    }

    async authenticate() {
        try {
            await this.sequelize.authenticate();
            console.log("Connect MySQL Success");
        } catch (error) {
            console.log("Error Connect MySQL!", error);
        }
    }

    getSequelize() {
        return this.sequelize;
    }

    static getInstance() {
        if (!Database.instance) {
            Database.instance = new Database();
        }
        return Database.instance;
    }
}

const instanceMySQL = Database.getInstance();
export default instanceMySQL;