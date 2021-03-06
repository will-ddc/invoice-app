'use strict';
const Promise = require('bluebird');
const bcrypt = Promise.promisifyAll(require('bcrypt'));

function hashPassword(user, options) {
  if (!user.changed('password')) {
    return
  }
  return bcrypt.hash(user.password, 10, null)
    .then(hash => {
      user.setDataValue('password', hash)
    })
}

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      allowNull: false,
      primaryKey: true,
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4
    },
    name: DataTypes.STRING,
    phone: DataTypes.STRING,
    email: {
      type: DataTypes.STRING,
      unique: true
    },
    title: DataTypes.STRING,
    password: DataTypes.STRING,
    role: DataTypes.STRING
  }, {
    hooks: {
      beforeCreate: hashPassword,
      beforeUpdate: hashPassword
    }
  });
  User.associate = (models) => {
    User.belongsTo(models.Company, {
      foreignKey: 'companyId'
    });
    User.hasMany(models.Invoices, {
      foreignKey: 'createdBy',
      as: 'createdBy'
    });
    User.hasMany(models.Employee, {
      foreignKey: 'employeeId',
      as: 'employeeId'
    });
    User.hasMany(models.Logo, {
      foreignKey: 'imageId',
      as: 'imageId'
    });
  };
  User.prototype.comparePassword = function (password) {
    return bcrypt.compare(password, this.password)
  };
  return User;
};
