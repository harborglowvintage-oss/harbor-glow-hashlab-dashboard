# Contributing to Harbor Glow HashLab Dashboard

Thank you for your interest in contributing to the Harbor Glow HashLab Dashboard! This document provides guidelines for contributing to the project.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR-USERNAME/harbor-glow-hashlab-dashboard.git`
3. Create a new branch: `git checkout -b feature/your-feature-name`
4. Make your changes
5. Test your changes thoroughly
6. Commit your changes: `git commit -m "Add your descriptive commit message"`
7. Push to your fork: `git push origin feature/your-feature-name`
8. Open a Pull Request

## Development Setup

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment configuration
cp .env.example .env

# Run in development mode
DEBUG=true python main.py
```

## Code Style

- Follow PEP 8 guidelines for Python code
- Use meaningful variable and function names
- Add docstrings to functions and classes
- Keep functions focused and concise

## Testing

Before submitting a PR, ensure:
- The application starts without errors
- All API endpoints return expected responses
- The UI renders correctly
- WebSocket connections work properly

## Pull Request Guidelines

- Provide a clear description of the changes
- Reference any related issues
- Include screenshots for UI changes
- Ensure your code follows the project's style guidelines
- Test your changes thoroughly

## Reporting Issues

When reporting issues, please include:
- A clear description of the problem
- Steps to reproduce the issue
- Expected vs actual behavior
- Environment details (OS, Python version, etc.)
- Screenshots if applicable

## Feature Requests

We welcome feature requests! Please:
- Check if the feature has already been requested
- Provide a clear use case
- Explain how it benefits users
- Consider implementation complexity

## Questions?

Feel free to open an issue for questions or reach out to the maintainers.

Thank you for contributing! ⚡
