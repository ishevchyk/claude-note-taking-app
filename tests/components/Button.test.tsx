import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Button from '@/components/Button';

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
  });

  it('applies primary variant classes by default', () => {
    render(<Button>Primary</Button>);
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('bg-neutral-900');
  });

  it('applies ghost variant classes when variant="ghost"', () => {
    render(<Button variant='ghost'>Ghost</Button>);
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('text-neutral-500');
    expect(btn.className).not.toContain('bg-neutral-900');
  });

  it('applies sm size classes when size="sm"', () => {
    render(<Button size='sm'>Small</Button>);
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('text-sm');
    expect(btn.className).toContain('px-3');
  });

  it('applies md size classes by default', () => {
    render(<Button>Medium</Button>);
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('px-4');
    expect(btn.className).toContain('py-2');
  });

  it('merges additional className', () => {
    render(<Button className='my-custom-class'>Btn</Button>);
    expect(screen.getByRole('button').className).toContain('my-custom-class');
  });

  it('is disabled when disabled prop is passed', () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('calls onClick when clicked', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Click</Button>);
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('does not call onClick when disabled', async () => {
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Disabled
      </Button>,
    );
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('has disabled:opacity-50 class', () => {
    render(<Button disabled>Btn</Button>);
    expect(screen.getByRole('button').className).toContain('disabled:opacity-50');
  });
});
