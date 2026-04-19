import mysql from "mysql2/promise";
import { env } from '$env/dynamic/private';

// console.log(env.DEPLOYMENT_SPECIFIC_VARIABLE);
let myPool = null;

export async function myPoolFn() {
  if (myPool) {
    return myPool;
  }

  try {
    // console.log('MySQL pool config', {
    //   host: env.SQL_HOST,
    //   user: env.SQL_USER,
    //   database: env.SQL_DATABASE,
    //   port: env.SQL_PORT || 3306,
    // });

    myPool = mysql.createPool({
          host: env.SQL_HOST,
          user: env.SQL_USER,
          password: env.SQL_PASSWORD,
          database: env.SQL_DATABASE,
          port: 3306,
         
    });
  } catch(error) {
    console.error("MySQL pool creation error");
    console.error(error);
    return error;
  }
  return myPool;
}