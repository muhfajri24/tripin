import pytest
from scripts import serve_demo


def test_demo_missing_build_has_actionable_error(tmp_path):
    with pytest.raises(ValueError, match="npm ci"):
        serve_demo.require_build(tmp_path)


def test_check_does_not_claim_connectivity(tmp_path, monkeypatch, capsys):
    (tmp_path / "index.html").write_text("<html>test</html>")
    monkeypatch.setattr(serve_demo, "FRONTEND_BUILD", tmp_path)
    serve_demo.main(["--check", "--source", "local"])
    output = capsys.readouterr().out
    assert "source=local" in output
    assert "not verified" in output


@pytest.mark.parametrize("value", ["0", "65536", "-1", "not-a-port"])
def test_invalid_port_is_rejected(value):
    with pytest.raises(SystemExit) as exc:
        serve_demo.main(["--port", value, "--check"])
    assert exc.value.code == 2
