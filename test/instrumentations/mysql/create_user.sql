CREATE USER 'password_test'@'localhost' IDENTIFIED BY 'password';
GRANT ALL PRIVILEGES ON *.* TO 'password_test'@'localhost'
    WITH GRANT OPTION;
