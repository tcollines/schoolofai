#!/bin/bash
echo "Installing mysql..."
brew install mysql
echo "Starting mysql service..."
brew services start mysql
